FROM nginx:1.27-alpine
COPY index.html app.js /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ > /dev/null || exit 1
