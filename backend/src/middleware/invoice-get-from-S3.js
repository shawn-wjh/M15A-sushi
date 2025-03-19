/**
 * Currently not used; for the retrieval of invoices from S3
 */

// const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
// const config = require('../config');

// async function getInvoiceFromS3(objectKey) {
//     try {
//       // Prepare parameters for GetObjectCommand
//       const params = {
//         Bucket: config.s3.bucketName || 'sushi-invoice-storage',
//         Key: objectKey,
//       };

//       // Retrieve the file
//       const { Body } = await S3Client.send(new GetObjectCommand(params));

//     //   // Convert the response to a string if it's a text-based file (XML in this case)
//     //   const streamToString = (stream) => {
//     //     return new Promise((resolve, reject) => {
//     //       const chunks = [];
//     //       stream.on('data', (chunk) => chunks.push(chunk));
//     //       stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));  // Convert to string (UTF-8)
//     //       stream.on('error', reject);
//     //     });
//     //   };

//     //   const fileContent = await streamToString(Body);  // Convert the stream to string (XML content)
//       console.log('Body retrieved', Body);

//       return;  // This is the XML string content of the invoice
//     } catch (error) {
//       console.error('Error retrieving invoice:', error);
//       throw error;
//     }
//   }

// module.exports = {
//     getInvoiceFromS3
// };
