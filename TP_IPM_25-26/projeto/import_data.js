import fs from 'fs';
import { parse } from 'csv-parse/sync';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const outputFile = 'db.json';

const CITIES = [
    {
        name: 'Porto',
        url: 'https://data.insideairbnb.com/portugal/norte/porto/2025-09-21/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/portugal/norte/porto/2025-03-08/visualisations/listings.csv'
    },
    {
        name: 'Lisboa',
        url: 'https://data.insideairbnb.com/portugal/lisbon/lisbon/2025-09-21/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/portugal/lisbon/lisbon/2025-03-08/visualisations/listings.csv'
    },
    {
        name: 'Barcelona',
        url: 'https://data.insideairbnb.com/spain/catalonia/barcelona/2025-09-14/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/spain/catalonia/barcelona/2025-03-05/visualisations/listings.csv'
    },
    {
        name: 'Madrid',
        url: 'https://data.insideairbnb.com/spain/comunidad-de-madrid/madrid/2025-09-14/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/spain/comunidad-de-madrid/madrid/2025-03-05/visualisations/listings.csv'
    },
    {
        name: 'Londres',
        url: 'https://data.insideairbnb.com/united-kingdom/england/london/2025-09-14/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/united-kingdom/england/london/2025-03-04/visualisations/listings.csv'
    },
    {
        name: 'Paris',
        url: 'https://data.insideairbnb.com/france/ile-de-france/paris/2025-06-06/visualisations/listings.csv',
        historyUrl: 'https://data.insideairbnb.com/france/ile-de-france/paris/2025-03-03/visualisations/listings.csv'
    }
];

async function sacarCSV(url) {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(60000),
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!response.ok) return null;
        const text = await response.text();
        return parse(text, { columns: true, skip_empty_lines: true });
    } catch (e) {
        console.error(` Erro no download: ${e.message}`);
        return null;
    }
}

function calcularEstatisticas(registos) {
    if (!registos || registos.length === 0) return { count: 0, price: 0, occupancy: 0 };

    let somaPreco = 0;
    let contaPrecoValido = 0;
    let somaDisponibilidade = 0;

    registos.forEach(r => {
        // Lógica de Preço
        if (r.price && r.price.trim() !== '') {
            const p = parseFloat(r.price.replace(/[$,]/g, ''));
            if (!isNaN(p)) {
                somaPreco += p;
                contaPrecoValido++;
            }
        }
        // Lógica de Disponibilidade
        const avail = parseInt(r.availability_365) || 0;
        somaDisponibilidade += avail;
    });

    // Médias
    const precoMedio = contaPrecoValido > 0 ? Math.round(somaPreco / contaPrecoValido) : 0;
    const mediaDisponibilidade = somaDisponibilidade / registos.length;
    // Estimativa de Ocupação: (365 - dias_livres) / 365
    const ocupacaoMedia = Math.round(((365 - mediaDisponibilidade) / 365) * 100);

    return {
        count: registos.length,
        price: precoMedio,
        occupancy: ocupacaoMedia
    };
}

async function gerarBaseDeDados() {
    let todosAlojamentos = []; // Vai guardar as listagens detalhadas
    let estatisticasCidades = []; // Vai guardar o resumo comparativo

    console.log(`--- A INICIAR IMPORTAÇÃO COMPLETA (ATUAL + HISTÓRICO) ---`);

    for (const city of CITIES) {
        console.log(`\n A processar: ${city.name}...`);
        
        // Processar dados atuais
        await sleep(3000);
        console.log(`A sacar dados Atuais...`);
        const registosAtuais = await sacarCSV(city.url);
        
        let statsAtual = { count: 0, price: 0, occupancy: 0 };
        
        if (registosAtuais) {
            // Calcular estatísticas atuais
            statsAtual = calcularEstatisticas(registosAtuais);

            // Limpar e guardar listagens detalhadas para o mapa/tabelas
            const listagensLimpas = registosAtuais.reduce((acc, item) => {
                let finalPrice = null;
                if (item.price && item.price.trim() !== '') {
                    const p = parseFloat(item.price.replace(/[$,]/g, ''));
                    if (!isNaN(p)) finalPrice = p;
                }

                // Guardar registo detalhado
                acc.push({
                    id: parseInt(item.id),
                    name: item.name,
                    city: city.name, 
                    host_id: parseInt(item.host_id),
                    host_name: item.host_name,
                    neighbourhood: item.neighbourhood,
                    latitude: parseFloat(item.latitude),
                    longitude: parseFloat(item.longitude),
                    room_type: item.room_type,
                    price: finalPrice,
                    availability_365: parseInt(item.availability_365),
                    number_of_reviews: parseInt(item.number_of_reviews),
                    reviews_per_month: item.reviews_per_month ? parseFloat(item.reviews_per_month) : 0,
                    license: (item.license && item.license.trim() !== '') ? item.license : null,
                    calculated_host_listings_count: parseInt(item.calculated_host_listings_count)
                });
                return acc;
            }, []);
            
            todosAlojamentos = [...todosAlojamentos, ...listagensLimpas];
            console.log(`      ✅ Atual: ${listagensLimpas.length} listagens guardadas.`);
        }

        await sleep(3000);
        console.log(`A sacar dados Históricos (Março)...`);
        const registosAntigos = await sacarCSV(city.historyUrl);
        
        let statsAntigo = { count: 0, price: 0, occupancy: 0 };
        if (registosAntigos) {
            statsAntigo = calcularEstatisticas(registosAntigos);
            console.log(`Histórico: Estatísticas calculadas.`);
        }

        estatisticasCidades.push({
            city: city.name,
            current: statsAtual, // { count: 25000, price: 110, occupancy: 70 }
            history: statsAntigo // { count: 22000, price: 95, occupancy: 60 }
        });
    }

    const dbStructure = {
        stats: estatisticasCidades,
        listings: todosAlojamentos
    };

    fs.writeFileSync(outputFile, JSON.stringify(dbStructure, null, 2));

    console.log('\n-----------------------------------');
    console.log('PROCESSO CONCLUÍDO!');
    console.log(`Listagens detalhadas guardadas: ${todosAlojamentos.length}`);
    console.log(`Estatísticas geradas para: ${estatisticasCidades.length} cidades.`);
    console.log('-----------------------------------');
}

gerarBaseDeDados();