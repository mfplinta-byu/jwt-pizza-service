const config = require('./config').metrics;
const os = require('os');

const unprocessedDefault = {
    http_latencies: [],
    http_req_num: {
        get: 0,
        put: 0,
        post: 0,
        delete: 0
    }
}

let unprocessedData = unprocessedDefault;

const requestTracker = (req, res, next) => {
    const start = Date.now();

    const handler = () => {
        const end = Date.now();
        const duration = end - start;

        if (['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
            unprocessedData.http_latencies.push(duration);
            switch(req.method) {
                case 'GET':
                    unprocessedData.http_req_num.get += 1;
                    break;
                case 'POST':
                    unprocessedData.http_req_num.post += 1;
                    break;
                case 'PUT':
                    unprocessedData.http_req_num.put += 1;
                    break;
                case 'DELETE':
                    unprocessedData.http_req_num.delete += 1;
                    break;
            }
        }
    };

    res.on('finish', handler);
    res.on('close', handler);
    next();
};



class MetricBuilder {
    constructor() {
        this.metrics = []
    }

    append(metricName, metricValue, type, unit) {
        return this.appendFromList(metricName, [metricValue], type, unit);
    }

    appendFromList(metricName, metricList, type, unit) {
        const dataPoints = [];
        for(const value in metricList) {
            dataPoints.push({
                asDouble: parseInt(value),
                timeUnixNano: Date.now() * 1000000,
                attributes: [
                    {
                        key: "source",
                        value: { "stringValue": config.source }
                    }
                ]
            });
        }
        console.log(`Sending ${metricList} for ${metricName}`)
        if(dataPoints.length == 0) {
            return;
        }
        this.metrics.push({
            name: metricName,
            unit: unit,
            [type]: {
                dataPoints: dataPoints,
                ...(type == 'sum' && {
                    aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                    isMonotonic: true
                })
            },
        })
    }

    toString() {
        const metric = {
            resourceMetrics: [
                {
                    scopeMetrics: [
                        {
                            metrics: this.metrics
                        },
                    ],
                },
            ],
        };

        return JSON.stringify(metric);
    }
}

function getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
}

async function sendMetricToGrafana(body) {
    await fetch(`${config.url}`, {
        method: 'POST',
        body: body,
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    })
        .then((response) => {
            if (!response.ok) {
                response.text().then((text) => {
                    console.error(`Failed to push metrics data to Grafana: ${text}`);
                    console.error(body);
                });
            } else {
                console.log(`Pushed metrics`);
            }
        })
        .catch((error) => {
            console.error('Error pushing metrics:', error);
        });
}

function sendMetricsPeriodically(period) {
    return setInterval(async () => {
        console.log('Sending metrics...')
        try {
            const buf = new MetricBuilder();
            httpMetrics(buf);
            systemMetrics(buf);
            // userMetrics(buf);
            // purchaseMetrics(buf);
            // authMetrics(buf);

            const metrics = buf.toString();
            await sendMetricToGrafana(metrics);
        } catch (error) {
            console.log('Error sending metrics', error);
        }
    }, period);
}

function httpMetrics(builder) {
    // if(unprocessedData.http_latencies.length == 0) {
    //     return;
    // }

    builder.appendFromList('latency', unprocessedData.http_latencies, 'sum', 'ms');
    builder.append('get_requests', unprocessedData.http_req_num.get, 'sum', '1');
    builder.append('put_requests', unprocessedData.http_req_num.put, 'sum', '1');
    builder.append('post_requests', unprocessedData.http_req_num.post, 'sum', '1');
    builder.append('delete_requests', unprocessedData.http_req_num.delete, 'sum', '1');

    unprocessedData.http_latencies = [];
    unprocessedData.http_req_num.get = 0;
    unprocessedData.http_req_num.put = 0;
    unprocessedData.http_req_num.post = 0;
    unprocessedData.http_req_num.delete = 0;
}

function systemMetrics(builder) {
    const cpuUsage = getCpuUsagePercentage();
    const memoryUsage = getMemoryUsagePercentage();
    builder.append('cpu_usage', cpuUsage, 'gauge', '%');
    builder.append('memory_usage', memoryUsage, 'gauge', '%');
}

// function userMetrics(builder) {

// }

// function purchaseMetrics(builder) {

// }

// function authMetrics(metrics) {

// }

module.exports = { sendMetricsPeriodically, requestTracker }