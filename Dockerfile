# Use uma imagem base leve com Python
FROM python:3.11-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia o arquivo HTML para o container
COPY index.html .

# Expõe a porta 5000
EXPOSE 5000

# Comando para iniciar o servidor HTTP
CMD ["python", "-m", "http.server", "5000", "--bind", "0.0.0.0"]