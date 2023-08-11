const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Chave de API do Mailchimp
const apiKey = "f0fa524ccf43188097c3a4a3e261fcb3"; // Substitua pela sua chave de API

// "Data Center" do Mailchimp
const dataCenter = "us11"; // Substitua pelo seu "Data Center" do Mailchimp

app.get("/check-email/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const endpoint = `https://${dataCenter}.api.mailchimp.com/3.0/search-members?query=${encodeURIComponent(
      email
    )}`;

    const headers = {
      Authorization: `apikey ${apiKey}`,
    };

    const response = await axios.get(endpoint, { headers });

    if (response.data.exact_matches.total_items > 0) {
      return res.status(200).json({ message: "Email já cadastrado" });
    } else {
      return res.status(404).json({ message: "Email não cadastrado" });
    }
  } catch (error) {
    console.error("Erro ao verificar o email:", error);
    res.status(500).json({ error: "Erro ao verificar o email" });
  }
});

app.post("/cadastro", async (req, res) => {
  const { email, nome, telefone, mensagem } = req.body;

  try {
    const listId = "969f735a8e"; // Substitua pelo ID da lista no Mailchimp

    // Endpoint da API do Mailchimp
    const endpoint = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members`;

    // Configuração do cabeçalho com a chave de API do Mailchimp
    const headers = {
      Authorization: `apikey ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Dados do novo contato
    const data = {
      email_address: email,
      status: "subscribed", // O status 'subscribed' adiciona o contato à lista
      merge_fields: {
        FNAME: nome,
        PHONE: telefone,
        MESSAGE: mensagem,
      },
    };

    // Enviar a solicitação POST para adicionar o contato à lista
    const response = await axios.post(endpoint, data, { headers });

    console.log("Resposta do Mailchimp:", response.data);

    res.status(200).json({ message: "Cadastro realizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar os dados para o Mailchimp:", error);
    res.status(500).json({
      error: "Ocorreu um erro ao enviar os dados. Tente novamente mais tarde.",
    });
  }
});

async function enviarEmailBackend(nome, telefone, email, mensagem) {
  try {
    // Configurações do servidor SMTP
    let transporter = nodemailer.createTransport(
      smtpTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "vendascardealempreendimentos@gmail.com",
          pass: "fcyrwldhmqmvkqqy",
        },
      })
    );

    // Corpo do e-mail
    let info = await transporter.sendMail({
      from: "vendascardealempreendimentos@gmail.com",
      to: ["benolopesdias@gmail.com"],
      subject: "Frutal - Mensagem do formulário da landing page",
      html: `<p>Nome: ${nome}</p>
             <p>Telefone: ${telefone}</p>
             <p>E-mail: ${email}</p>
             <p>Mensagem: ${mensagem}</p>`,
    });

    console.log("E-mail enviado: %s", info.messageId);
  } catch (err) {
    console.error(err);
  }
}

app.post("/send-email", async (req, res) => {
  const { nome, telefone, email, mensagem } = req.body;

  try {
    await enviarEmailBackend(nome, telefone, email, mensagem);
    res.status(200).json({ msg: "E-mail enviado com sucesso" });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
