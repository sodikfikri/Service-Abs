FROM node:12-alpine

WORKDIR /var/www/html/services/abs

COPY ./ /var/www/html/services/abs

RUN npm i

RUN npm i -g nodemon

RUN mv /var/www/html/services/abs/node_modules /node_modules

EXPOSE 3101

ENTRYPOINT ["/bin/sh", "-c"]

CMD ["cp /node_modules /var/www/html/services/abs/node_modules; nodemon Services.js"]