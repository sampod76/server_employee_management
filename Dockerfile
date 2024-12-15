FROM node:20

# Create app directory
WORKDIR /app

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
EXPOSE 5005
EXPOSE 5006

CMD ["yarn","dev"]

# # Bundle app source
# RUN yarn build

# RUN ["chmod","+x","./entrypoint.sh"]
# ENTRYPOINT [ "sh","./entrypoint.sh" ]

# # Run app
# CMD ["yarn", "start"]
