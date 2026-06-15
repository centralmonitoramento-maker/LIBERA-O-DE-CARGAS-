import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sgMail from "@sendgrid/mail";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit setup for base64 audit images / signatures
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Initialize SendGrid Key
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    sgMail.setApiKey(sendgridKey);
    console.log("SendGrid SDK successfully initialized with API key.");
  } else {
    console.warn("WARNING: SENDGRID_API_KEY is not defined in environment variables. Real emails will fail, but the portal will simulate active dispatch.");
  }

  // API endpoint to dispatch alert emails with rich formatting
  app.post("/api/send-alert-email", async (req, res) => {
    try {
      const { plate, driverName, occurrenceType, occurrenceDescription, targetEmails, originEmail } = req.body;

      if (!plate || !targetEmails || !Array.isArray(targetEmails) || targetEmails.length === 0) {
        return res.status(400).json({ error: "Campo obrigatório ausente (placa, destinatários)." });
      }

      const senderEmail = "central.monitoramento@atacadaodiaadia.com.br";
      const subject = `[ALERTA DE OCORRÊNCIA] Carga ${plate} - ${occurrenceType || "Geral"}`;

      // Build styled HTML template for the auditor report email
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 16px; background-color: #ffffff; color: #1c2434; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0b1532; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 4px solid #f29c1f;">
            <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.8px; color: #ffffff;">ALERTA DE OCORRÊNCIA EM CURSO</h1>
            <p style="margin: 6px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #f29c1f; font-weight: 800;">Atacadão Dia a Dia - CargaRelease</p>
          </div>
          
          <div style="padding: 24px 16px 8px 16px;">
            <p style="font-size: 13.5px; margin-top: 0; line-height: 1.6; color: #475569;">
              Prezada equipe de monitoramento e fiscalização,
              <br/><br/>
              Informamos que foi registrada uma <strong>ocorrência operacional crítica</strong> durante o processo de auditoria de pátio/gate para a carga identificada abaixo:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px;">
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b; width: 35%;">VEÍCULO / PLACA:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #0b1532; font-family: monospace; font-weight: 800; font-size: 15px;">${plate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b;">MOTORISTA:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #334155; font-weight: bold;">${driverName || "NÃO CADASTRADO"}</td>
              </tr>
              <tr style="background-color: #fef2f2;">
                <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #b91c1c;">TIPO DE OCORRÊNCIA:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-weight: 900; color: #b91c1c; text-transform: uppercase;">${occurrenceType || "OUTRAS DIVERGÊNCIAS"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b; vertical-align: top;">DESCRIÇÃO DETALHADA:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #1e293b; line-height: 1.6; font-weight: 500;">${occurrenceDescription || "Nenhuma descrição extra anexada pelo auditor."}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b;">USUÁRIO RESPONSÁVEL:</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #334155; font-size: 12px;">${originEmail || "central.monitoramento@atacadaodiaadia.com.br"}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border-top: 1px solid #edf2f7; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
            Mensagem de comunicação automática instantânea via API de Alertas do <strong>CargaRelease</strong>.<br/>
            Central de Monitoramento e Prevenção de Perdas — Atacadão Dia a Dia.
          </div>
        </div>
      `;

      if (!sendgridKey) {
        console.log("=== NOTIFICAÇÃO SIMULADA DE ALERTA DE E-MAIL (SEM CHAVE SENDGRID) ===");
        console.log(`REMETENTE CENTRAL: ${senderEmail}`);
        console.log(`DESTINATÁRIOS: ${targetEmails.join(", ")}`);
        console.log(`ASSUNTO: ${subject}`);
        console.log("======================================================================");

        return res.json({
          success: true,
          simulated: true,
          message: "Modo de simulação ativo (Chave SendGrid não fornecida). O e-mail foi impresso no terminal em tempo real."
        });
      }

      // Send via SendGrid multiple (each target gets a distinct copy to keep standard visibility)
      const messageArgs = {
        to: targetEmails,
        from: {
          email: "central.monitoramento@atacadaodiaadia.com.br",
          name: "Central de Monitoramento - CargaRelease"
        },
        replyTo: originEmail || "central.monitoramento@atacadaodiaadia.com.br",
        subject: subject,
        html: emailHtml
      };

      await sgMail.sendMultiple(messageArgs);
      console.log(`Alerta de ocorrência para placa ${plate} enviado com sucesso via SendGrid.`);

      res.json({
        success: true,
        message: "Alerta em tempo real transmitido e enviado via SendGrid com sucesso!"
      });
    } catch (err: any) {
      console.error("Erro no envio do e-mail da ocorrência via SendGrid:", err);
      const errorMsg = err?.response?.body || err?.message || err;
      res.status(500).json({
        error: "Falha na comunicação com a API SendGrid.",
        details: errorMsg
      });
    }
  });

  // Main integration with Vite development middleware and fallback to SPA static production folder
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening as active entry point on port ${PORT}`);
  });
}

startServer();
