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
    const phoneNumberPrefix = extractPhoneNumberPrefix(input);
    if (phoneNumberPrefix) {
        redisClient.sismember('ABC/DEF', phoneNumberPrefix, (err, reply) => {
            if (err) {
                process.stdout.write('Error searching for phone number prefix\n');
            } else if (reply === 1) {
                process.stdout.write(`Phone number prefix exists: ${phoneNumberPrefix}\n`);
            } else {
                process.stdout.write(`Phone number prefix does not exist: ${phoneNumberPrefix}\n`);
            }
        });
    } else {
        process.stdout.write(`Invalid phone number: ${input}\n`);
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