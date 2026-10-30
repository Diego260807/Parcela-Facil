import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Shared server-side Gemini client
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

// API Endpoint to process receipt / invoice images (OCR + Smart Extraction)
app.post('/api/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada para leitura.' });
    }

    const ai = getAiClient();
    if (!ai) {
      // Intelligent fallback if key not yet attached
      return res.json({
        success: true,
        extracted: {
          store: 'Loja Identificada (Exemplo)',
          totalAmount: 450.0,
          purchaseDate: new Date().toISOString().split('T')[0],
          installments: 3,
          category: 'Tecnologia',
          confidence: 'Simulação (Configure sua GEMINI_API_KEY para OCR real)',
        },
      });
    }

    // Clean base64 string if data URL prefix was passed
    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

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
Analise a imagem deste comprovante/cupom fiscal/nota fiscal e extraia os dados da compra em formato JSON rigoroso:
- store: Nome fantasia do estabelecimento ou loja vendedora
- totalAmount: Valor total numérico da compra em reais (formato número float, ex: 129.90)
- purchaseDate: Data da compra no formato AAAA-MM-DD (se não houver ano explícito, assuma o ano atual ${new Date().getFullYear()})
- installments: Quantidade de parcelas identificadas (se for à vista ou não mencionado, retorne 1)
- category: Uma das seguintes categorias: "Alimentação & Mercado", "Eletrônicos & Tecnologia", "Casa & Eletro", "Vestuário & Moda", "Saúde & Farmácia", "Lazer & Viagens", "Serviços & Assinaturas", "Outros"
- notes: Pequena observação sobre itens identificados`,
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
          required: ['store', 'totalAmount', 'purchaseDate', 'installments', 'category'],
        },
      },
    });

    const parsedData = JSON.parse(response.text ?? '{}');
    return res.json({
      success: true,
      extracted: parsedData,
    });
  } catch (error: any) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      error: 'Falha ao processar o comprovante.',
      details: error?.message || 'Erro desconhecido',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ParcelaFácil server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
