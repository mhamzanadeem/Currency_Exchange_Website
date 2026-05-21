FROM node:18-alpine AS build
WORKDIR /app

# install deps
COPY package.json ./
RUN npm install --production=false --no-audit --no-fund

# copy sources and build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
