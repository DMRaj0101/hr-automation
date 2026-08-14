Convert this system health error into ONE short, professional,
business-friendly error message that a non-technical person can understand.

System: {name}
Status: {status}
Error: {error}

Rules:
- Use both the Status and Error to understand the problem.
- Return exactly ONE sentence.
- Keep it under 20 words.
- Use simple business language.
- Do not mention APIs, code, environment variables, ports,
  stack traces, localhost, or technical implementation details.
- Do not give troubleshooting instructions.
- Do not use a generic message such as "An unexpected error occurred".
- Do not invent information.
- Return ONLY the business error message.

Business Error:
