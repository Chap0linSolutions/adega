#!./bin/bash
echo "Rodando 4 instâncias do Adega, nas portas de 3001 a 3004..."
nohup npm run start 3001 & disown
nohup npm run start 3002 & disown
nohup npm run start 3003 & disown
nohup npm run start 3004 & disown
echo "Rodando o servidor nginx..."
nohup nginx & disown
