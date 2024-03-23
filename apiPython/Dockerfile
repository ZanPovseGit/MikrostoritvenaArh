FROM python:alpine

WORKDIR /apiPython

# Copy the current directory contents into the container at /app
COPY . /apiPython

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Run app.py when the container launches
CMD ["python", "apiFlask.py"]
