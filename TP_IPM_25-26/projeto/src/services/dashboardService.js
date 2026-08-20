export async function getDashboardStats() {
  try {
    // Pedimos os dados detalhados (listings) E as estatísticas comparativas (stats)
    const [resListings, resStats] = await Promise.all([
      fetch('http://localhost:3000/listings'),
      fetch('http://localhost:3000/stats')
    ]);

    const data = await resListings.json();
    const statsData = await resStats.json(); 

    let totalListings = data.length;
    let totalPriceSum = 0;
    let totalValidPrices = 0;
    
    const statsMap = {};
    statsData.forEach(s => { statsMap[s.city] = s; });

    const cityGroups = {};
    const neighborhoodStats = {}; 

    data.forEach(item => {
      const city = item.city || 'Outra';

      if (!cityGroups[city]) {
        cityGroups[city] = {
          count: 0,
          priceSum: 0,
          priceCount: 0,
          availabilitySum: 0
        };
      }

      cityGroups[city].count++;
      cityGroups[city].availabilitySum += item.availability_365;

      if (item.price !== null && item.price > 0) {
        totalPriceSum += item.price;
        totalValidPrices++;
        cityGroups[city].priceSum += item.price;
        cityGroups[city].priceCount++;
      }

      // Áreas Críticas
      const hood = item.neighbourhood; 
      if (hood) { 
          if (!neighborhoodStats[hood]) {
              neighborhoodStats[hood] = { total: 0, highOccupancyCount: 0 };
          }
          neighborhoodStats[hood].total++;
          if (item.availability_365 < 65) {
              neighborhoodStats[hood].highOccupancyCount++;
          }
      }
    });

    // Calcular Áreas Críticas Reais
    let criticalAreasCount = 0;
    Object.values(neighborhoodStats).forEach(stats => {
        if (stats.total > 10 && (stats.highOccupancyCount / stats.total) > 0.5) {
            criticalAreasCount++;
        }
    });

    const globalAvgPrice = totalValidPrices > 0 
      ? Math.round(totalPriceSum / totalValidPrices) 
      : 0;

    const formattedCities = Object.keys(cityGroups).map(cityName => {
      const stats = cityGroups[cityName];
      
      const avgPrice = stats.priceCount > 0 
        ? Math.round(stats.priceSum / stats.priceCount) 
        : 0;
      const avgAvailability = stats.availabilitySum / stats.count;
      const occupancyRate = Math.round(((365 - avgAvailability) / 365) * 100);

      // Calculo crescimento
      let growthStr = 'N/A';
      const cityStat = statsMap[cityName];
      
      if (cityStat && cityStat.history && cityStat.history.count > 0) {
          const current = cityStat.current.count;
          const history = cityStat.history.count;
          const growthPct = ((current - history) / history) * 100;
          const sign = growthPct > 0 ? '+' : '';
          growthStr = `${sign}${growthPct.toFixed(1)}%`;
      }

      return {
        name: cityName,
        listagens: stats.count, 
        crescimento: growthStr, 
        preco: avgPrice,       
        ocupacao: occupancyRate 
      };
    });

    return {
      kpis: {
        totalListings: totalListings,
        avgPrice: globalAvgPrice,
        criticalAreas: criticalAreasCount 
      },
      citiesData: formattedCities
    };

  } catch (error) {
    console.error("Erro no serviço de dados:", error);
    throw error;
  }
}


// Anomalias 
export async function getAnomaliesData() {
  try {
    const [resListings, resStats] = await Promise.all([
      fetch('http://localhost:3000/listings'),
      fetch('http://localhost:3000/stats')
    ]);

    const data = await resListings.json();
    const statsData = await resStats.json(); 

    const totalListings = data.length;
    const convertedHousing = data.filter(i => i.room_type === 'Entire home/apt' && i.availability_365 > 90).length;

    let totalCurrentSum = 0;
    let totalHistorySum = 0;

    statsData.forEach(city => {
        totalCurrentSum += city.current.count;
        totalHistorySum += city.history.count;
    });

    let growthGlobalStr = '+0%';
    if (totalHistorySum > 0) {
        const growth = ((totalCurrentSum - totalHistorySum) / totalHistorySum) * 100;
        const sign = growth > 0 ? '+' : '';
        growthGlobalStr = `${sign}${growth.toFixed(1)}%`;
    }

    const alerts = [];

    // Ocupação Excessiva
    const highOccupation = data.filter(i => i.availability_365 < 30 && i.number_of_reviews > 10);
    highOccupation.slice(0, 5).forEach(item => {
      alerts.push({
        id: item.id,
        type: 'ocupacao',
        title: 'Propriedade com ocupação excessiva',
        desc: `Propriedade "${item.name}" em ${item.neighbourhood}, ${item.city}. Indisponível na maior parte do ano.`,
        severity: 'medium',
        icon: '🟡',
        status: 'Ativo'
      });
    });

    //Host Profissional
    const proHosts = data.filter(i => i.calculated_host_listings_count > 10);
    const uniqueProHosts = [...new Map(proHosts.map(item => [item.host_id, item])).values()];

    uniqueProHosts.slice(0, 5).forEach(item => {
      alerts.push({
        id: item.id,
        type: 'host',
        title: 'Host Profissional Detectado',
        desc: `O Host ${item.host_name} (ID: ${item.host_id}) possui ${item.calculated_host_listings_count} propriedades ativas em ${item.city}.`,
        severity: 'high',
        icon: '🟠',
        status: 'Ativo'
      });
    });

    //Reviews Suspeitas
    const suspiciousReviews = data.filter(i => i.reviews_per_month > 6);
    suspiciousReviews.slice(0, 5).forEach(item => {
      alerts.push({
        id: item.id,
        type: 'review',
        title: 'Propriedade com avaliações suspeitas',
        desc: `Propriedade em ${item.neighbourhood} registou uma média de ${item.reviews_per_month} reviews/mês.`,
        severity: 'low',
        icon: '🔵',
        status: 'Ativo'
      });
    });

    const citiesCount = {};
    data.forEach(item => {
        const city = item.city || 'Desconhecido';
        if(!citiesCount[city]) citiesCount[city] = 0;
        citiesCount[city]++;
    });

    return {
      kpis: {
        total: totalListings,
        critical: alerts.length,
        converted: convertedHousing,
        growth: growthGlobalStr
      },
      cityStats: citiesCount,
      alerts: alerts.sort(() => Math.random() - 0.5)
    };

  } catch (error) {
    console.error("Erro ao processar anomalias:", error);
    return { kpis: {}, alerts: [] };
  }
}

// Executivo
export async function getExecutiveStats(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();
    const total = data.length;

    if (total === 0) return null;

    const noLicense = data.filter(i => 
      !i.license || i.license === '' || i.license.toLowerCase().includes('exempt')
    );

    const highOccupancy = data.filter(i => i.availability_365 < 65);

    const urgentCases = data.filter(i => 
      (!i.license || i.license === '' || i.license.toLowerCase().includes('exempt')) && 
      (i.availability_365 < 65)
    );

    const hostMap = {};
    data.forEach(item => {
      if (!hostMap[item.host_id]) {
        hostMap[item.host_id] = { 
          name: item.host_name, 
          count: 0, 
          id: item.host_id,
          issues: 0 
        };
      }
      hostMap[item.host_id].count++;
      if (item.availability_365 < 65 || !item.license) {
        hostMap[item.host_id].issues++;
      }
    });

    const topHosts = Object.values(hostMap)
      .filter(h => h.count > 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const criticalList = urgentCases
      .slice(0, 5)
      .map(i => ({
        address: `Rua (Alojamento #${i.id}), ${i.neighbourhood}`,
        problem: 'Sem Licença e Ocupação Excessiva',
        host: i.host_name,
        severity: 'Crítico',
        sevClass: 'red',
        status: 'Pendente',
        statusClass: 'pendente'
      }));

    if (criticalList.length === 0) {
        const fallbackList = noLicense.slice(0, 5).map(i => ({
            address: `Rua (Alojamento #${i.id}), ${i.neighbourhood}`,
            problem: 'Sem Licença Municipal',
            host: i.host_name,
            severity: 'Alto',
            sevClass: 'orange',
            status: 'Pendente',
            statusClass: 'pendente'
        }));
        criticalList.push(...fallbackList);
    }

    const nonCompliantIDs = new Set([
        ...noLicense.map(i => i.id),
        ...highOccupancy.map(i => i.id)
    ]);
    const conformidadeCount = total - nonCompliantIDs.size;
    
    const conformidadePct = ((conformidadeCount / total) * 100).toFixed(1);
    const noLicensePct = ((noLicense.length / total) * 100).toFixed(1);
    
    return {
      kpis: {
        semLicenca: noLicense.length,
        semLicencaPct: noLicensePct,
        ocupacaoExcessiva: highOccupancy.length,
        emConformidade: conformidadeCount,
        emConformidadePct: conformidadePct,
        acaoUrgente: urgentCases.length
      },
      priorityList: criticalList,
      multiHosts: topHosts.map(h => ({
        nome: `${h.name} (${h.id})`,
        total: h.count,
        zona: city,
        conformidade: h.issues > (h.count / 2) ? 'Crítico' : 'Médio',
        confClass: h.issues > (h.count / 2) ? 'red' : 'yellow'
      })),
      conformityStats: [
        { label: 'Em Conformidade', val: parseFloat(conformidadePct), color: 'bg-green' },
        { label: 'Sem Licença', val: parseFloat(noLicensePct), color: 'bg-red' },
        { label: 'Ocupação Alta', val: ((highOccupancy.length/total)*100).toFixed(1), color: 'bg-orange' }
      ]
    };

  } catch (error) {
    console.error("Erro no serviço executivo:", error);
    return null;
  }
}

//Relatórios
export async function getUrgentReportData(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();

    if (!data || data.length === 0) return [];

    // Filtra as propriedades críticas
    const urgentCases = data.filter(i => 
      (!i.license || i.license === '' || i.license.toLowerCase().includes('exempt')) && 
      (i.availability_365 < 65)
    );

    // Formata para o CSV ficar limpo
    return urgentCases.map(item => ({
      ID_Propriedade: item.id,
      Nome: item.name,
      Host_ID: item.host_id,
      Host_Nome: item.host_name,
      Bairro: item.neighbourhood,
      Licenca: item.license || 'NÃO DETETADA',
      Disponibilidade_365: item.availability_365,
      Status: 'AÇÃO IMEDIATA',
      Link: `https://www.airbnb.com/rooms/${item.id}`
    }));

  } catch (error) {
    console.error("Erro ao gerar dados do relatório:", error);
    return [];
  }
}

//Relatório Completo
export async function getReportFull(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();
    return data;
  } catch (e) { console.error(e); return []; }
}

// Listagens +300 Dias (Ocupação Excessiva / Baixa Disponibilidade)
export async function getReportHighOccupancy(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();
    // Filtra disponibilidade < 65 dias (significa ocupado ~300 dias)
    return data.filter(i => i.availability_365 < 65).map(i => ({
      ID: i.id,
      Nome: i.name,
      Host: i.host_name,
      Bairro: i.neighbourhood,
      Disponibilidade_365: i.availability_365,
      Dias_Ocupados_Est: 365 - i.availability_365
    }));
  } catch (e) { console.error(e); return []; }
}

//Sem Licença
export async function getReportNoLicense(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();
    return data.filter(i => 
      !i.license || i.license === '' || i.license.toLowerCase().includes('exempt')
    ).map(i => ({
      ID: i.id,
      Nome: i.name,
      Host: i.host_name,
      Bairro: i.neighbourhood,
      Licenca_Original: i.license || 'NULO'
    }));
  } catch (e) { console.error(e); return []; }
}

//Multi-Hosts (Agrupado por Host)
export async function getReportMultiHosts(city) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${city}`);
    const data = await response.json();
    
    const hostMap = {};
    data.forEach(i => {
      if (!hostMap[i.host_id]) {
        hostMap[i.host_id] = { 
          Host_ID: i.host_id, 
          Host_Nome: i.host_name, 
          Total_Propriedades: 0,
          Bairros: new Set()
        };
      }
      hostMap[i.host_id].Total_Propriedades++;
      hostMap[i.host_id].Bairros.add(i.neighbourhood);
    });

    // Filtra quem tem mais de 2 casas e formata
    return Object.values(hostMap)
      .filter(h => h.Total_Propriedades > 2)
      .map(h => ({
        ...h,
        Bairros: Array.from(h.Bairros).join(', ')
      }))
      .sort((a, b) => b.Total_Propriedades - a.Total_Propriedades);

  } catch (e) { console.error(e); return []; }
}