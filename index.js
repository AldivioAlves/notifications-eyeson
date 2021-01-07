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


const job = new CronJob('* */2 * * * *', () => {
    notifications
    .sendToTopic(
        'sync', // device fcm tokens...
        {
          data: {
            context:'syncronization'
          },
        },
        {
          contentAvailable: true,
          priority: 'high',
          timeToLive:1
        },
      );
})
job.start()

const sendNotifications = (req, res) => {
    const { notebookUuid, userName, notebookName, userToken } = req.body
    const message = {
        topic: notebookUuid,
        data: {},
        notification: {
            title: "Nova mensagem",
            body: `${userName} enviou uma nova mensagem no caderno ${notebookName}.`
        }
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
                    notifications.subscribeToTopic(userToken, notebookUuid)
                })
                .catch((e) => {
                    res.status(500).send("Notificação não enviada!")
                    notifications.subscribeToTopic(userToken, notebookUuid)
                })
        })
        .catch((e) =>{})

}

app.post('/notifications', sendNotifications)

const port = 3000

app.listen(process.env.PORT || port, () => console.log("running"))
