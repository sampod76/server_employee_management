FROM node:21.7.1

# Create app directory
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/uploads/images /usr/src/uploads/videos /usr/src/uploads/pdfs /usr/src/uploads/audios /usr/src/uploads/docs /usr/src/uploads/others
 
# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./


# Install app dependencies
RUN yarn install


# Copy the rest of the application code
COPY . .

COPY .env .env
#  first my local file to docker in create .env file
# COPY .env.exaple .env

# Expose port 8000
EXPOSE 8000

# Bundle app source
RUN yarn build

RUN ["chmod","+x","./entrypoint.sh"]
ENTRYPOINT [ "sh","./entrypoint.sh" ]

# Run app
CMD ["yarn", "start"]
