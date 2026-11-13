
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Limite para receber arquivos de até 10 MB em Base64
app.use(express.json({ limit: '14mb' }));

// Configuração do Supabase no servidor
// Utiliza a chave pública (anon/publishable), nunca a service_role.
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    : null;

// Cliente da Gemini
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Tipo auxiliar para guardar o usuário autenticado na requisição
type AuthenticatedRequest = Request & {
  authenticatedUserId?: string;
};

// Validação da autenticação pelo Supabase
const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  void (async () => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Autenticação necessária. Faça login novamente.',
      });
      return;
    }

    if (!supabase) {
      console.error('Configurações do Supabase ausentes no servidor.');

      res.status(500).json({
        error: 'Serviço de autenticação indisponível.',
      });
      return;
    }

    const token = authorization.slice(7);

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        error: 'Sessão inválida ou expirada. Faça login novamente.',
      });
      return;
    }

    (req as AuthenticatedRequest).authenticatedUserId = data.user.id;

    next();
  })().catch((error) => {
    console.error('Erro na validação de autenticação:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Não foi possível validar sua autenticação.',
      });
    }
  });
};

// Limite simples de 5 solicitações por usuário a cada minuto
// Observação: este controle é armazenado na memória do processo.
const requestCounts = new Map<
  string,
  { count: number; resetAt: number }
>();

const ocrRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = (req as AuthenticatedRequest).authenticatedUserId;

  if (!userId) {
    res.status(401).json({
      error: 'Usuário não autenticado.',
    });
    return;
  }

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const current = requestCounts.get(userId);

  if (!current || now >= current.resetAt) {
    requestCounts.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    });

    next();
    return;
  }

  if (current.count >= maxRequests) {
    res.status(429).json({
      error: 'Limite de solicitações atingido. Tente novamente em um minuto.',
    });
    return;
  }

  current.count += 1;
  next();
};

// Verifica se o arquivo corresponde ao formato informado
const validateFileSignature = (
  buffer: Buffer,
  mimeType: string
): boolean => {
  if (mimeType === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      )
    );
  }

  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  return false;
};

// API de leitura de comprovantes
app.post(
  '/api/scan-receipt',
  requireAuth,
  ocrRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (
        typeof imageBase64 !== 'string' ||
        typeof mimeType !== 'string'
      ) {
        res.status(400).json({
          error: 'Arquivo inválido ou não enviado.',
        });
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];

      if (!allowedTypes.includes(mimeType)) {
        res.status(400).json({
          error: 'Formato não permitido. Envie JPG, PNG, WEBP ou PDF.',
        });
        return;
      }

      // Exige uma URL Base64 válida com o MIME informado
      const dataUrlPattern =
        /^data:(image\/jpeg|image\/png|image\/webp|application\/pdf);base64,([A-Za-z0-9+/=\r\n]+)$/;

      const match = imageBase64.match(dataUrlPattern);

      if (!match || match[1] !== mimeType) {
        res.status(400).json({
          error: 'O arquivo enviado não possui um formato válido.',
        });
        return;
      }

      const cleanedBase64 = match[2].replace(/\s/g, '');

      if (
        !cleanedBase64 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          cleanedBase64
        )
      ) {
        res.status(400).json({
          error: 'Conteúdo do arquivo inválido.',
        });
        return;
      }

      const fileBuffer = Buffer.from(cleanedBase64, 'base64');

      const maxFileSize = 10 * 1024 * 1024;

      if (fileBuffer.length === 0 || fileBuffer.length > maxFileSize) {
        res.status(400).json({
          error: 'O arquivo deve ter no máximo 10 MB.',
        });
        return;
      }

      if (!validateFileSignature(fileBuffer, mimeType)) {
        res.status(400).json({
          error: 'O conteúdo do arquivo não corresponde ao formato informado.',
        });
        return;
      }

      // Não utiliza dados simulados se a chave estiver ausente
      const ai = getAiClient();

      if (!ai) {
        res.status(503).json({
          error: 'Leitura por IA temporariamente indisponível.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: cleanedBase64,
            },
          },
          {
            text: `Você é um assistente financeiro especialista em OCR de cupons fiscais, faturas e comprovantes de cartão de crédito no Brasil.

Analise o documento e extraia os dados da compra.

Retorne:
- store: Nome do estabelecimento ou loja.
- totalAmount: Valor total numérico da compra em reais.
- purchaseDate: Data da compra no formato AAAA-MM-DD. Se não houver ano explícito, considere o ano atual ${new Date().getFullYear()}.
- installments: Quantidade de parcelas. Se for à vista ou não houver informação, retorne 1.
- category: Uma das categorias:
  "Alimentação & Mercado",
  "Eletrônicos & Tecnologia",
  "Casa & Eletro",
  "Vestuário & Moda",
  "Saúde & Farmácia",
  "Lazer & Viagens",
  "Serviços & Assinaturas",
  "Outros".
- notes: Pequena observação sobre os itens identificados.

Não invente informações que não estejam visíveis no documento.
Se algum dado não puder ser identificado, utilize um valor vazio ou zero conforme o tipo do campo.`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              totalAmount: { type: Type.NUMBER },
              purchaseDate: { type: Type.STRING },
              installments: { type: Type.INTEGER },
              category: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: [
              'store',
              'totalAmount',
              'purchaseDate',
              'installments',
              'category',
            ],
          },
        },
      });

      const responseText = response.text;

      if (!responseText) {
        res.status(502).json({
          error: 'A IA não retornou dados para este comprovante.',
        });
        return;
      }

      const parsedData = JSON.parse(responseText);

      res.json({
        success: true,
        extracted: parsedData,
      });
    } catch (error) {
      console.error('Erro no processamento OCR:', error);

      res.status(500).json({
        error: 'Falha ao processar o comprovante. Tente novamente.',
      });
    }
  }
);

// Inicialização do servidor
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get(/.*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Tratamento de erros do Express
  app.use(
    (
      error: any,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error('Erro no servidor:', error);

      if (error?.type === 'entity.too.large') {
        res.status(413).json({
          error: 'Arquivo muito grande. O limite é de 10 MB.',
        });
        return;
      }

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Erro interno do servidor.',
        });
      }
    }
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `ParcelaFácil server running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error('Não foi possível iniciar o servidor:', error);
  process.exit(1);
});
