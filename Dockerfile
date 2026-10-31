# Production image for Cloudflare Containers, built by `wrangler deploy` in Workers Builds.
# It runs the server that `npm run build` produced just before on the same Linux x64 machine,
# so sharp's native binary in .next/standalone matches. Secrets reach it at runtime from the Worker.
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
# public/ is empty (git keeps no empty folders); add `COPY --chown=node:node public ./public` once it has files.
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
USER node
EXPOSE 8080
CMD ["node", "server.js"]
