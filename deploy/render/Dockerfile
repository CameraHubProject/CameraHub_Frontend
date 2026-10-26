FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY deploy/render/nginx.conf.template /etc/nginx/camerahub.conf.template
COPY deploy/render/entrypoint.sh /camerahub-entrypoint.sh
RUN chmod 755 /camerahub-entrypoint.sh
ENTRYPOINT ["/camerahub-entrypoint.sh"]
