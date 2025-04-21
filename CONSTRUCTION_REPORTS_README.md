# Construction Reports Feature

This feature allows users to submit and view construction reports around campus. All reports are automatically filtered using OpenAI to ensure they are:
1. Actually about construction (not spam or unrelated content)
2. Appropriate (not containing offensive or inappropriate material)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB connection string - required for storing construction reports
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/campusmap?retryWrites=true&w=majority

# OpenAI API key - required for AI content moderation
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. MongoDB Setup

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster and database
3. Get your connection string from the MongoDB Atlas dashboard
4. Add a database user with read/write permissions
5. Replace the `MONGODB_URI` in your `.env.local` file with your actual connection string

### 3. OpenAI API Setup

1. Create an OpenAI account at https://platform.openai.com/
2. Generate an API key from your account dashboard
3. Replace the `OPENAI_API_KEY` in your `.env.local` file with your actual API key

## How It Works

1. **Submission**: Users submit construction reports through the form
2. **AI Moderation**: OpenAI's moderation API checks if the content is appropriate
3. **Content Verification**: A second check confirms if the content is actually about construction
4. **Storage**: Valid reports are stored in MongoDB and immediately displayed
5. **Display**: All approved reports are shown to all users, with newest first

## Moderation Process

The system uses two levels of AI filtering:

1. **OpenAI Moderation API**: Screens for harmful content (violence, hate speech, sexual content, etc.)
2. **GPT Model Check**: Verifies if the content is actually a construction report

A report must pass both checks to be automatically approved. If either check fails, the report is marked as "pending" and not displayed to users.

## Development and Testing

During development, you can test the system by submitting various reports:

- Valid construction reports should appear immediately
- Inappropriate content should be rejected
- Non-construction content should be rejected

The MongoDB database stores the moderationResult for each submission for auditing purposes.
