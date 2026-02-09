---
description: Deploy the application to the production server (nabdai.io).
---

1. **Prerequisites**
   - Ensure you are on the `main` branch or have the latest stable code.
   - Ensure your local `.env` file is configured (the script uses it to check for existence).
   - Ensure you have SSH access to `root@72.62.190.235`.

2. **Run Deployment Script**
   Execute the remote deployment script:
   ```bash
   bash scripts/deploy-remote.sh
   ```

3. **Verify Deployment**
   - After the script completes, check [http://72.62.190.235:3000](http://72.62.190.235:3000) (or the mapped domain [https://nabdai.io](https://nabdai.io) if configured).
   - Check service status on the server:
     ```bash
     ssh root@72.62.190.235 "cd /app/better-chatbot && docker compose -f docker/compose.prod.yml ps"
     ```
