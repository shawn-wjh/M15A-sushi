/**
 * Currently not used; for the upload and retrieval of invoices from S3
 */

// const config = require('../config');
// const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// // Initialize S3 client
// const s3Client = new S3Client({
//   region: config.aws.region,
//   credentials: {
//     accessKeyId: config.aws.credentials.accessKeyId,
//     secretAccessKey: config.aws.credentials.secretAccessKey
//   },
//   endpoint: `https://s3.${config.aws.region}.amazonaws.com`
// });

// /**
//  * Upload UBL XML invoice to S3 bucket
//  */
// async function uploadToS3(xml, invoiceId) {
//   if (!xml || !invoiceId) {
//     throw new Error('Empty XML or invoiceId');
//   }

//   const params = {
//     Bucket: config.s3.bucketName || 'sushi-invoice-storage',
//     Key: `invoices/${invoiceId}.xml`,
//     Body: xml,
//     ContentType: 'application/xml'
//   };

//   try {
//     const response = await s3Client.send(new PutObjectCommand(params));

//     return {
//       success: true,
//       location: `s3://sushi-invoice-storage/invoices/${invoiceId}.xml`,
//       response
//     };
//   } catch (error) {
//     throw new Error(`Failed to upload to S3: ${error.message}`);
//   }
// }

// async function getInvoiceFromS3(objectKey) {
//   try {
//     // Prepare parameters for GetObjectCommand
//     const params = {
//       Bucket: config.s3.bucketName || 'sushi-invoice-storage',
//       Key: objectKey,
//     };

//     // Retrieve the file
//     const { Body } = await s3Client.send(new GetObjectCommand(params));

//   //   // Convert the response to a string if it's a text-based file (XML in this case)
//   //   const streamToString = (stream) => {
//   //     return new Promise((resolve, reject) => {
//   //       const chunks = [];
//   //       stream.on('data', (chunk) => chunks.push(chunk));
//   //       stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));  // Convert to string (UTF-8)
//   //       stream.on('error', reject);
//   //     });
//   //   };

//   //   const fileContent = await streamToString(Body);  // Convert the stream to string (XML content)
//     console.log('Body retrieved', Body);

//     return;  // This is the XML string content of the invoice
//   } catch (error) {
//     console.error('Error retrieving invoice:', error);
//     throw error;
//   }
// }

// module.exports = {
//   uploadToS3,
//   getInvoiceFromS3
// };
