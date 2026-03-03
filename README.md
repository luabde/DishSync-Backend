# DishSync-Backend

## Instalación
1. Instalar pnpm https://pnpm.io/installation

    Si no tienes pnpm instalado en tu dispositivo, deberias instalarlo con el comando de abajo si tienes windows (desde powershell) o desde el enlace proporcionado si tu sistema operativo es distinto.

    `Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression`

2. Añadir dependencias dependencias (ünicamente hay que instalar, ya estan añadidas, por lo tanto pasar al siguiente paso)
    
    En primer lugar, hay que inicializar el proyecto
    
    `pnpm init`

    En segundo lugar, debemos instalar las dependencias principales, que son typescript, node express y cors

    `pnpm add -D typescript @types/node @types/express @types/cors`

    Instalar tambien tsx **solo en entorno development** para evitar hacer builds todo el tiempo.

    `pnpm add -D ts-node tsx nodemon`

    Añadir dependencias para que se pueda crear variables de entorno desde el script de package.json
    `pnpm add -D cross-env`

    Añadir express y cors en producción

    `pnpm add express cors`

    Añadimos dotenv para variables de entorno

    `pnpm add dotenv`

3. Instalar todas las dependencias

    `pnpm install`

4. Hacer funcionar el proyecto
    - En el entorno dev
    `pnpm run dev`

    - En entorno prod

        `pnpm run build`

        `pnpm run start:prod`

        Si se quiere que se ejecute permenentemente, se debe de usar pm2 logs


        `pnpm add -g pm2`

        `pm2 start dist/server.js --name dishsync-backend`