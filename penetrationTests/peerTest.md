# Peer Pen Test - Josh Wiseman, Matheus Plinta

# Self attack
## Josh Wiseman
- After searching through my own source, I was able to identity two main weaknesses.

|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 12, 2025                                                          |
| Target         | pizza.joshwiseman.click                                               |
| Classification | SQL Injection                                                              |
| Severity       | 3                                                                      |
| Description    | SQL injection, was able to change someone else information without proper admin authentication.         |
| Corrections    | Sanitized the inputs to the update user API                                                 |

|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 11, 2025                                                          |
| Target         | pizza.joshwiseman.click                                               |
| Classification | Known Security Issue                                                              |
| Severity       | 2                                                                      |
| Description    | By using known generics from the script one could log into the a@jwt.com admin         |
| Corrections    | Changed script to prevent known / generic default admin, and changed the current admin       |




## Matheus Plinta
|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 1X, 2025                                                          |
| Target         | pizza.matheusplinta.com                                               |
| Classification |                                                              |
| Severity       |                                                                       |
| Description    |       |
| Images         |                  |
| Corrections    |       |


# Peer attack records
## Josh attacking Mat:
|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 14, 2025                                                          |
| Target         | pizza.matheusplinta.com                                                |
| Classification | SQL Injection                                                              |
| Severity       | 3                                                                      |
| Description    | SQL injection, was able to change Mat's users without proper admin authentication.         |
| Corrections    | After leting me hit the vulnerable endpoint he switched it out for the hardened code stopping the attack                                                |

|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 14, 2025                                                          |
| Target         | pizza.matheusplinta.com                                               |
| Classification | Known Security Issue                                                              |
| Severity       | 2                                                                      |
| Description    | Was able to use known generics from the script I logged into a@jwt.com admin         |
| Corrections    | After hitting the user, he altered the admins info       |

## Mat attacking Josh
|  Item           | Result                                                                 |
|----------------|------------------------------------------------------------------------|
| Date           | April 14, 2025                                                        |
| Target         | pizza.joshwiseman.click                                               |
| Classification |                                                                       |
| Severity       |                                                                       |
| Description    |                                                                       |
| Images         |                                                                       |
| Corrections    |       |


Combined summary of learnings

After running through the pen testing we learned a few things
- Santizing SQL is critical. Not using ? in SQL queries just gives the attack free reigns to first look at the dumped stack, and then to be able to get information from or destroy the database
- Be mindful of how much your system is known. Having public code (or shared code in our case) means that it very simple for white box hacking. Although its security through obfuscation, not letting hackers see source code make black box testing much harder
- XSS only works if the information is treated as innerHTML, document.write(), or eval(), and doesn't work when interpreted as just plaintext
- Pen testing is hard. Without having consistent practice it can be difficult to break into applications.
