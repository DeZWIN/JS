const readline = require('readline');
const redis = require('redis');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const redisConfig = {
    host: '127.0.0.1',
    port: 6379,
};

const redisClient = redis.createClient(redisConfig.port, redisConfig.host);

rl.on('line', (input) => {
    const commandPrefix = 'GETROUTE:';
    if (input.startsWith(commandPrefix)) {
        const commandArgs = input.substring(commandPrefix.length).split(',');
        const messageId = commandArgs[0];
        const sessionId = commandArgs[1];
        const phoneNumber = commandArgs[2];
        const option = commandArgs[3];

        const calledId = extractPhoneNumberPrefix(phoneNumber);

        if (calledId) {
            console.log('Received GETROUTE command:');
            console.log('Message ID:', messageId);
            console.log('Session ID:', sessionId);
            console.log('Called ID (Prefix):', calledId);
            console.log('Option:', option);

            // Ищем оператора связи по префиксу в Redis
            redisClient.hget('результаты_файла_1', calledId, (err, reply) => {
                if (err) {
                    console.log('Error searching for phone number operator');
                } else if (reply) {
                    console.log('Phone number operator:', reply);

                    // Сопоставляем оператора с префиксом
                    const operator = reply;

                    // Ищем подходящий префикс для оператора
                    redisClient.hkeys('operator_prefix_mapping', (err, prefixKeys) => {
                        if (err) {
                            console.log('Error searching for prefix keys');
                        } else if (prefixKeys) {
                            const matchingPrefix = prefixKeys.find((prefix) => prefix.startsWith(operator));
                            if (matchingPrefix) {
                                console.log('Matching prefix for operator:', matchingPrefix);

                                // Формируем команду REROUTE с новым Called ID
                                const rerouteCommand = `REROUTE:${sessionId},${matchingPrefix},${option}`;
                                process.stdout.write(rerouteCommand + '\n');
                            } else {
                                console.log('No matching prefix found for operator:', operator);

                                // Формируем команду NOROUTE с Session ID
                                const norouteCommand = `NOROUTE:${sessionId}`;
                                process.stdout.write(norouteCommand + '\n');
                            }
                        } else {
                            console.log('No prefix keys found');
                        }
                    });

                } else {
                    console.log('No operator found for the phone number prefix:', calledId);

                    // Формируем команду NOROUTE с Session ID
                    const norouteCommand = `NOROUTE:${sessionId}`;
                    process.stdout.write(norouteCommand + '\n');
                }
            });

        } else {
            process.stdout.write(`Invalid phone number: ${phoneNumber}\n`);
        }

    } else {
        process.stdout.write('Invalid command\n');
    }
}).on('close', () => {
    redisClient.quit();
    process.exit();
});

function extractPhoneNumberPrefix(input) {
    // Регулярное выражение для извлечения префикса номера телефона.
    // В данном примере предполагается, что префикс состоит из 3 цифр и предшествует остальным цифрам номера.
    const phoneNumberPrefixRegex = /^(\d{3})\d+$/;
    const match = input.match(phoneNumberPrefixRegex);
    if (match) {
        return match[1]; // Возвращаем первую группу захвата, которая содержит префикс номера телефона.
    }
    return null; // Если префикс не найден, возвращаем null.
}

module.exports = {
    redis: redisConfig,
};
