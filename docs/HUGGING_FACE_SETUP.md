# How to Connect Hugging Face

You can connect Hugging Face Inference Endpoints (or the Serverless Inference API) to this application by configuring it as an OpenAI-compatible provider.

## Prerequisites

1.  **Hugging Face Account**: You need an account at [huggingface.co](https://huggingface.co/).
2.  **Access Token**: Generate a User Access Token.
    *   Go to **Settings > Access Tokens**.
    *   Create a new token with **Read** permissions.
    *   Copy the token (it starts with `hf_...`).

## Step 1: Configure Environment

1.  Open your `.env` file.
2.  Add your Hugging Face API key:
    ```bash
    HUGGINGFACE_API_KEY=hf_your_actual_token_here
    ```

## Step 2: Enable Configuration

1.  Open `openai-compatible.config.ts` in the root directory.
2.  Uncomment the **Hugging Face** section (I have added a template for you).
3.  Customize the `baseUrl` and `models` if needed.
    *   **Serverless API**: Use `https://api-inference.huggingface.co/v1`.
    *   **Dedicated Endpoint**: If you deploy a dedicated Inference Endpoint, use the URL provided by Hugging Face (e.g., `https://xxxx.us-east-1.aws.endpoints.huggingface.cloud/v1`).
    *   **Models**: Update `apiName` to the Hugging Face model ID (e.g., `meta-llama/Meta-Llama-3-8B-Instruct`) and `uiName` to whatever you want to see in the chat dropdown.
    ### Image Generation
- [x] Implement `generateImageWithHuggingFace` in `src/lib/ai/image/generate-image.ts`
- [x] Update `src/app/api/user/actions.ts` to support Hugging Face provider
- [x] Update `src/components/user/user-detail/generate-avatar-dialog.tsx` to add Hugging Face option
- [x] Add Hugging Face Icon `src/components/ui/hugging-face-icon.tsx`

### Voice (TTS/STT)
> [!NOTE]
> The current voice architecture (`src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`) is designed exclusively for OpenAI's Realtime API using WebRTC/WebSocket protocols. Hugging Face does not support this specific protocol. Integrating Hugging Face voice would require a significant architectural rewrite to support a modular Voice Provider system (fetching individual STT/TTS REST APIs). This is currently out of scope for a direct integration but can be explored as a separate feature request.

### Plugins & Agents
- [x] Verified that Agents can be powered by any OpenAI-compatible model (including HF) via `openai-compatible.config.ts`.
- [ ] User needs to configure `openai-compatible.config.ts` (Done in previous step)

## Step 3: Apply Changes

Run the following command in your terminal to parse the configuration and update your environment:

```bash
pnpm openai-compatiable:parse
```

This script reads `openai-compatible.config.ts` and updates the `OPENAI_COMPATIBLE_DATA` variable in your `.env` file.

## Step 4: Restart Server

Restart your development server to load the new environment variables:

```bash
pnpm dev
```

## Step 5: Verify

1.  Go to the Chat interface.
2.  Open the model selector.
3.  You should see your configured Hugging Face models (e.g., "Llama 3 8B (HF)") under the "Hugging Face" provider section.
