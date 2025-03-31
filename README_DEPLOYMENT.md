# Deployment Guide

This document provides instructions for deploying the Sushi Invoice application to AWS Elastic Beanstalk.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- EB CLI installed (`npm install -g aws-eb-cli`)
- Node.js and npm

## Configuration Files

The following configuration files are included for deployment:

- `Procfile`: Tells Elastic Beanstalk how to run the application
- `.ebextensions/nodecommand.config`: Configures the Node.js environment
- `.elasticbeanstalk/config.yml`: Defines Elastic Beanstalk deployment settings
- `.ebignore`: Specifies which files to exclude from deployment

## Environment Variables

The application requires several environment variables to be set in the Elastic Beanstalk environment. 
These are documented in the `.env.example` file and include:

- AWS credentials and region
- DynamoDB table names
- JWT configuration
- Server settings

## Deployment Steps

### First-time Setup

1. Initialize the Elastic Beanstalk application (if not already done):
   ```
   eb init
   ```

2. Create a new environment:
   ```
   eb create sushi-invoice-app
   ```

3. Set environment variables:
   ```
   eb setenv KEY1=VALUE1 KEY2=VALUE2 ...
   ```
   (Set all required variables from `.env.example`)

### Regular Deployments

1. Make sure all changes are committed to the repository
2. Deploy the application:
   ```
   eb deploy
   ```

## CI/CD with AWS CodePipeline

The application is configured for continuous deployment using AWS CodePipeline.
When code is merged to the main branch, it automatically:

1. Pulls the latest code
2. Deploys it to Elastic Beanstalk

## Troubleshooting

- Check the application logs in the Elastic Beanstalk console
- Use `eb logs` to retrieve recent logs
- Run `eb health` to check the health of the environment
- Use `eb ssh` to connect to the EC2 instance for debugging

## Rollback

To roll back to a previous version:
1. Go to the Elastic Beanstalk console
2. Select your environment
3. Go to the "Application versions" tab
4. Select the version you want to restore
5. Click "Deploy" 