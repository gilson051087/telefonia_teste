# Deploy Ubuntu

Este projeto roda bem em Ubuntu com:

- `nginx` servindo o frontend buildado
- backend Node ouvindo em `127.0.0.1:4000`
- `systemd` mantendo o backend ativo
- variaveis sensiveis fora do arquivo `.service`

## 1. Instalar pacotes

```bash
sudo apt update
sudo apt install -y nginx curl
```

## 2. Instalar Node.js 22

O backend usa `node:sqlite`, entao use Node `22.x`.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Copiar o projeto

Exemplo de destino:

```bash
sudo mkdir -p /var/www/telefonia_teste
sudo chown -R $USER:$USER /var/www/telefonia_teste
cd /var/www/telefonia_teste
git clone SEU_REPOSITORIO current
cd current
```

Ou envie os arquivos do projeto para `/var/www/telefonia_teste/current`.

## 4. Instalar dependencias e buildar

```bash
cd /var/www/telefonia_teste/current
npm install
npm run build
```

## 5. Ajustar permissao da pasta do banco

```bash
sudo mkdir -p /var/www/telefonia_teste/current/api/data
sudo chown -R www-data:www-data /var/www/telefonia_teste/current/api/data
```

## 6. Configurar backend no systemd

Copie o arquivo `deploy/systemd/telefonia-teste-backend.service` para:

```bash
sudo cp /var/www/telefonia_teste/current/deploy/systemd/telefonia-teste-backend.service /etc/systemd/system/
```

Crie a pasta do arquivo de ambiente:

```bash
sudo mkdir -p /etc/telefonia-teste
```

Copie o template de ambiente:

```bash
sudo cp /var/www/telefonia_teste/current/deploy/systemd/telefonia-teste-backend.env.example /etc/telefonia-teste/backend.env
```

Edite a porta e a chave JWT:

```bash
sudo nano /etc/telefonia-teste/backend.env
```

Depois ative:

```bash
sudo systemctl daemon-reload
sudo systemctl enable telefonia-teste-backend
sudo systemctl start telefonia-teste-backend
sudo systemctl status telefonia-teste-backend
```

## 7. Configurar nginx

Copie a configuracao:

```bash
sudo cp /var/www/telefonia_teste/current/deploy/nginx/telefonia_teste.conf /etc/nginx/sites-available/telefonia_teste
sudo ln -s /etc/nginx/sites-available/telefonia_teste /etc/nginx/sites-enabled/telefonia_teste
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Liberar firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 9. Resetar admin se necessario

```bash
cd /var/www/telefonia_teste/current
node --experimental-sqlite api/reset-admin.js
```

Credenciais iniciais do utilitario local:

- usuario: `admin`
- senha: `123456`

Em producao, altere a senha imediatamente apos a primeira autenticacao.

## 10. Logs uteis

```bash
sudo journalctl -u telefonia-teste-backend -f
sudo systemctl status telefonia-teste-backend
sudo tail -f /var/log/nginx/error.log
```

## Atualizacao do projeto

```bash
cd /var/www/telefonia_teste/current
git pull
npm install
npm run build
sudo systemctl restart telefonia-teste-backend
sudo systemctl reload nginx
```
