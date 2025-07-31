# Global Voice - Voice Chat in any Browser Tab

Global Voice is a simple and lightweight chrome extension that enables advanced voice input capabilities in any web application. It allows users to use their microphone to input text in any text field, textarea, or contenteditable element across the web.

## Features

- Gemini tranascription

```python
from google import genai

client = genai.Client()

myfile = client.files.upload(file='path/to/sample.mp3')
prompt = 'Generate a transcript of the speech.'

response = client.models.generate_content(
  model='gemini-2.5-flash',
  contents=[prompt, myfile]
)

print(response.text)
```

- Supports any text field, textarea, or contenteditable element in any web application
- Modern UI / appealing look and feel but non-intrusive
- Lightweight and fast
- Open source and free to use
- Requres API key from Google AI studio