const fs = require('fs');
const csv = require('csv-parser');
const redis = require('redis');

//указываем путь к файлам
const file1Path = 'def.csv';
const file2Path = 'running.csv';

const redisConfig = {
  host: '127.0.0.1',
  port: 6379
};

// Создаем клиент Redis
const client = redis.createClient(redisConfig);

// Функция для чтения и парсинга файла
function parseFile(filePath, targetArray) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ headers: true })) // Указываем, что первая строка содержит заголовки столбцов
      .on('data', (data) => {
        // Обрабатываем данные
        const score = parseFloat(data.score); 
        const value = JSON.stringify(data);
        client.zadd(targetKey, score, value);
      })
      .on('end', () => {
        console.log(`Парсинг файла ${filePath} завершен.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Парсим оба файла и отправляем результаты в Redis
Promise.all([parseFile(file1Path, 'результаты_файла_1'), parseFile(file2Path, 'результаты_файла_2')])
  .then(() => {
    console.log('Результаты сохранены в Redis.');
  })
  .catch((error) => {
    console.error('Ошибка при парсинге файла:', error);
  })
  .finally(() => {
    client.quit(); // Закрываем соединение с Redis после завершения
  });