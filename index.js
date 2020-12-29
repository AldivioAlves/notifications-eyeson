const express = require('express')
const bodyParser = require('body-parser')
const { admin } = require('./firebase-config')
const app = express();
const notifications = admin.messaging()
const { CronJob } = require('cron');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


const job = new CronJob('5 * * * * *', () => {
    notifications
    .sendToTopic(
        'sync', // device fcm tokens...
        {
          data: {
            owner:'eu beti',
            user: 'má oe',
            picture:'nao tem hein',
          },
        },
        {
          // Required for background/quit data-only messages on iOS
          contentAvailable: true,
          // Required for background/quit data-only messages on Android
          priority: 'high',
        },
      );
})
job.start()

const sendNotifications = (req, res) => {
    console.log("Sera encaminhada uma nova mensagem para os usuarios!!!")
    const { notebookUuid, userName, notebookName, userToken } = req.body
    const message = {
        topic: notebookUuid,
        data: {},
        notification: {
            title: "Nova mensagem",
            body: `${userName} enviou uma nova mensagem no caderno ${notebookName}.`
        }
    }

    const subscribeUser = () => {
        notifications
            .subscribeToTopic(userToken, notebookUuid)
            .then(res => console.log('sucesso em inscrever novamente o user'))
            .catch(e => console.log('erro em inscrever novamente o user ', e))
    }
    console.log('user token ', userToken)
    notifications
        .unsubscribeFromTopic(userToken, notebookUuid)
        .then(() => {
            notifications
                .send(message)
                .then((value) => {
                    console.log('mensagem enviada com sucesso!')
                    res.status(200).send("Notificação enviada com sucesso!")
                    subscribeUser()
                })
                .catch((e) => {
                    console.log('error ao enviar a mensagem!', e)
                    res.status(500).send("Notificação não enviada!")
                    subscribeUser()
                })
        })
        .catch((e) => console.log('erro ao cancelar a inscrisao ', e))

}

app.post('/notifications', sendNotifications)

const port = 3000

app.listen(process.env.PORT || port, () => console.log("servico executando na porta =>", port))
