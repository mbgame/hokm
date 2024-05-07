interface Card {
    type: 'spades' | 'hearts' | 'clubs' | 'diamonds';
    number: 'ace' | 'king' | 'queen' | 'jack' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
    value:number;
  }
  
  export function sortCards(cards: Card[][]): Card[] {
    const numberOrder: Card['number'][] = [
      '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace',
    ];
    const typeOrder: Card['type'][] = ['clubs', 'diamonds', 'hearts', 'spades'];
  
    // Sort each sub-array by number
    const numberSorted = cards.map(suit => suit.sort((a, b) => numberOrder.indexOf(a.number) - numberOrder.indexOf(b.number)));
  
    const typeSorted = numberSorted.map(suit => suit.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)));
  
    // Concatenate and sort by type
    return typeSorted.flat();
  }