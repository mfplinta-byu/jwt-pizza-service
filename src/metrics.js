const config = require('./config').metrics;
const os = require('os');

class MetricBuilder {
    constructor() {
        this.metrics = []
    }

    append(metricName, metricValue, type, unit) {
        this.metrics.push({
            name: metricName,
            unit: unit,
            [type]: {
                dataPoints: [
                    {
                        asDouble: metricValue,
                        timeUnixNano: Date.now() * 1000000,
                        attributes: [
                            {
                                key: "source",
                                value: { "stringValue": config.source }
                            }
                        ]
                    },
                ],
                // aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                // isMonotonic: true
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
                    console.error(`Failed to push metrics data to Grafana: ${text}\n${body}`);
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
            userMetrics(buf);
            purchaseMetrics(buf);
            authMetrics(buf);

            const metrics = buf.toString();
            await sendMetricToGrafana(metrics);
        } catch (error) {
            console.log('Error sending metrics', error);
        }
    }, period);
}

function httpMetrics(builder) {

}

function systemMetrics(builder) {
    const cpuUsage = getCpuUsagePercentage();
    const memoryUsage = getMemoryUsagePercentage();
    builder.append('cpu_usage', cpuUsage, 'gauge', '%');
    builder.append('memory_usage', memoryUsage, 'gauge', '%');
}

function userMetrics(builder) {

}

function purchaseMetrics(builder) {

}

function authMetrics(metrics) {

}

module.exports = { sendMetricsPeriodically }