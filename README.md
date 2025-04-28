# WhatsApp Business Integration Dashboard

A React-based dashboard for managing WhatsApp Business API communications, built with modern web technologies.

## Features

- **Real-time Chat Interface**: View and respond to WhatsApp messages in real-time
- **Contact Management**: View and manage WhatsApp contacts
- **User Authentication**: Secure email/password authentication system
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Company Information Management**: Store and manage company details
- **User Management**: Add and manage system users
- **Contact Activity Toggle**: Enable/disable contact interactions

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Backend & Authentication**: Supabase
- **Real-time Updates**: Supabase Realtime
- **UI Components**: Lucide React Icons
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Supabase account and project

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActivationToggle.tsx
│   ├── ContactList.tsx
│   ├── MessageList.tsx
│   └── ThemeToggle.tsx
├── context/            # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/               # Utility functions and configurations
│   └── supabase.ts
├── pages/             # Route components
│   ├── Chat.tsx
│   ├── Login.tsx
│   ├── ResetPassword.tsx
│   └── Settings.tsx
└── types.ts           # TypeScript type definitions

supabase/
├── functions/         # Supabase Edge Functions
│   ├── manage-users/
│   └── reset-password/
└── migrations/        # Database migrations
```

## Features in Detail

### Authentication

- Email/password authentication
- Password reset functionality
- Protected routes
- Session management

### Chat Interface

- Real-time message updates
- Message history
- Contact list with latest message sorting
- Message grouping by conversation
- Timestamp display
- Responsive layout with mobile support

### Settings

- Company information management
  - Add/edit/remove company details
  - Multiple information types (Phone, Email, URL, etc.)
- User management
  - Add new users
  - Delete existing users
  - Password reset
- Theme toggle (Light/Dark mode)

### Contact Management

- View all WhatsApp contacts
- Toggle contact active status
- Sort contacts by recent activity
- Real-time status updates

## Database Schema

### Tables

1. **contacts**
   - id (bigint, primary key)
   - name (text)
   - wa_id (numeric)

2. **messages**
   - id (bigint, primary key)
   - from (numeric)
   - to (numeric)
   - body (text)
   - time (timestamp with time zone)
   - message_id (text)

3. **company_info**
   - id (bigint, primary key)
   - type (text)
   - name (text)
   - data (text)

4. **inactive**
   - id (bigint, primary key)
   - wa_id (numeric)
   - inactive (text)

### Security

- Row Level Security (RLS) enabled on all tables
- Authenticated user policies for data access
- Secure API endpoints with proper CORS configuration

## Edge Functions

1. **manage-users**
   - Create new users
   - Delete existing users
   - List all users
   - Requires admin privileges

2. **reset-password**
   - Handle password reset requests
   - Generate secure reset links
   - Email delivery integration

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React best practices and hooks
- Implement proper error handling
- Use async/await for asynchronous operations
- Maintain consistent component structure

### Security Considerations

- Implement proper authentication checks
- Use environment variables for sensitive data
- Enable RLS policies for database access
- Validate user input
- Handle errors gracefully

### Performance Optimization

- Implement proper loading states
- Use proper React memo and callbacks
- Optimize database queries
- Implement proper caching strategies

## Deployment

The application can be deployed to any static hosting service. For Netlify deployment:

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `dist` directory
3. Configure environment variables in the hosting platform
4. Set up proper redirects for client-side routing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License