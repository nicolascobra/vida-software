from fastapi import APIRouter
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re
from datetime import date

router = APIRouter()

class QRCodePayload(BaseModel):
    qrcode_url: str

@router.post("/scan")
async def scan_nota(payload: QRCodePayload):
    url = payload.qrcode_url
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            estado = "desconhecido"
            if ".sp." in url: estado = "SP"
            elif ".pr." in url: estado = "PR"
            elif ".rs." in url: estado = "RS"
            elif ".mg." in url: estado = "MG"
            elif ".rj." in url: estado = "RJ"
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            estabelecimento = "Mercado / Estabelecimento"
            cnpj = ""
            valor_total = 0.0
            data_emissao = ""
            itens = []
            
            # ====== NOME DO ESTABELECIMENTO ======
            estab_el = soup.find(id="u20")
            if estab_el:
                estabelecimento = estab_el.text.strip()
            else:
                estab_el = soup.find("div", class_="txtTopo")
                if estab_el: estabelecimento = estab_el.text.strip()

            # ====== CNPJ ======
            cnpj_match = re.search(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}", soup.get_text())
            if cnpj_match:
                cnpj = cnpj_match.group(0)

            # ====== VALOR TOTAL ======
            valor_el = soup.find("span", class_="txtMax")
            if not valor_el:
                valor_el = soup.find("span", class_="totalNumb")
            if valor_el:
                v_text = valor_el.text.replace("R$", "").replace(".", "").replace(",", ".").strip()
                try:
                    valor_total = float(v_text)
                except ValueError:
                    pass
                    
            # ====== DATA EMISSAO ======
            texto_geral = soup.get_text()
            data_match = re.search(r"Emissão[:\s\n]+(\d{2})[-/](\d{2})[-/](\d{4})", texto_geral)
            if data_match:
                d, m, y = data_match.group(1), data_match.group(2), data_match.group(3)
                data_emissao = f"{y}-{m}-{d}"
            else:
                data_emissao = date.today().isoformat()

            # ====== ITENS ======
            table = soup.find("table", id="tabResult")
            if table:
                rows = table.find_all("tr")
                for row in rows:
                    nome_item = row.find("span", class_="txtTit")
                    if nome_item:
                        itens.append(nome_item.text.strip())

            return {
                "estabelecimento": estabelecimento,
                "cnpj": cnpj,
                "valor_total": valor_total,
                "data": data_emissao,
                "itens": itens if itens else None,
                "estado": estado
            }

    except Exception as e:
        print(f"Erro NFC-e: {e}")
        return {"erro": "nao_disponivel"}
