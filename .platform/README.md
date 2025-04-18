# AWS Elastic Beanstalk Platform Configuration

This directory contains configuration overrides for the AWS Elastic Beanstalk platform.

## Nginx Configuration

The `nginx/conf.d/proxy.conf` file increases the maximum allowed upload file size to 10MB.
This is necessary for handling larger image uploads in the invoice image processing feature.

By default, Elastic Beanstalk's Nginx configuration limits file uploads to 1MB, which is too
small for many invoice images.

## Deployment

These configuration files are automatically applied when deploying to Elastic Beanstalk. No
additional steps are required.
