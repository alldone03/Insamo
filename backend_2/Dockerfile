# Development Dockerfile
FROM node:22-alpine

WORKDIR /var/www

# Enable corepack for yarn v4
RUN corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install


EXPOSE 3000

# Run development server
CMD ["yarn", "dev"]
