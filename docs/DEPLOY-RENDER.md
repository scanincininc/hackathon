# Deploy the referral demo on Render

This is a demonstration deployment of the existing app. At startup, it loads the repository's `referral_emails.json` fixture directly into the queue. It does not connect to Mailpit, SendGrid, or another mail service.

## Setup

1. Push this branch to the connected GitHub repository.
2. In Render, create a Blueprint from that repository and select `render.yaml`.
3. Keep the `Free` plan selected and deploy the `iris-demo` service.
4. Open the service URL and choose **Enter queue**. The API health check is `/api/health`.

The included referral and staff data are synthetic demo fixtures. Render's free service uses an ephemeral filesystem: if the service restarts or redeploys, the SQLite database and any assignments are reset. The sample queue is rebuilt automatically from `referral_emails.json` when the service starts.

Render's free web service behavior is described in its [free instance documentation](https://render.com/docs/free).
