const dedupe = (arr) => {
  const seen = new Set();
  return arr.filter(item => {
      const key = item[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
  });
};

const pre_treino = [["banana",100,89,1.1,23.0,0.3],["mamao",150,60,0.6,15.0,0.1],["aveia com mel",60,220,6.0,42.0,3.5],["pao integral com mel",60,170,5.0,34.0,1.5],["torradinha com mel",40,150,3.0,30.0,1.0]];
const cafe_da_manha = [["ovos mexidos",120,186,14.0,1.0,13.0],["queijo minas",50,65,6.5,1.0,4.0],["iogurte grego",150,130,12.0,8.0,5.0],["atum em lata",80,94,20.0,0.0,1.5],["aveia com mel",60,220,6.0,42.0,3.5],["banana",100,89,1.1,23.0,0.3],["pao integral",50,120,4.5,22.0,1.5],["abacate",80,128,1.2,6.5,12.0],["pasta de amendoim",30,186,7.0,6.5,16.0]];
const lanche_manha =  [["ovo cozido",60,93,8.0,0.5,6.5],["atum em lata",80,94,20.0,0.0,1.5],["queijo minas",50,65,6.5,1.0,4.0],["banana",100,89,1.1,23.0,0.3],["mamao",150,60,0.6,15.0,0.1],["torradinha",30,120,2.5,24.0,1.0],["pao integral",50,120,4.5,22.0,1.5],["pasta de amendoim",30,186,7.0,6.5,16.0],["amendoim",30,176,7.0,5.0,15.0]];
const lanche_tarde =  [["atum em lata",80,94,20.0,0.0,1.5],["ovo cozido",60,93,8.0,0.5,6.5],["whey com agua",35,130,25.0,4.0,1.5],["banana",100,89,1.1,23.0,0.3],["aveia com mel",50,185,5.0,35.0,3.0],["mamao",150,60,0.6,15.0,0.1],["torradinha",30,120,2.5,24.0,1.0],["pasta de amendoim",30,186,7.0,6.5,16.0]];
const almoco =        [["frango grelhado",150,248,46.0,0.0,5.5],["arroz branco",150,195,3.5,43.0,0.5],["feijao",100,132,8.5,24.0,0.5],["salada mista",100,25,1.5,4.0,0.3],["fruta da estacao",120,70,0.8,17.0,0.2]];
const janta =         [["frango grelhado",150,248,46.0,0.0,5.5],["arroz branco",130,169,3.0,37.0,0.4],["feijao",100,132,8.5,24.0,0.5],["salada mista",100,25,1.5,4.0,0.3],["fruta da estacao",120,70,0.8,17.0,0.2]];
const ceia =          [["cha",200,2,0.0,0.4,0.0],["queijo minas",40,52,5.2,0.8,3.2],["iogurte grego",100,87,8.0,5.0,3.5],["banana",80,71,0.9,18.0,0.2],["mel",15,46,0.1,12.5,0.0],["mamao",100,40,0.4,10.0,0.1]];

const CARDAPIO = {
  cafe: dedupe([...pre_treino, ...cafe_da_manha]),
  almoco: almoco,
  lanche: dedupe([...lanche_manha, ...lanche_tarde]),
  jantar: dedupe([...janta, ...ceia]),
  outro: []
};

export default CARDAPIO;
