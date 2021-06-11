export enum GameModes{
    HideAndSeek,
    FindStatic,
    HintedSeek,
}

export enum GameTools{ //mniejsze koło itd.
    HeatCompass,
}

export interface GameSetting{
    settings: GameTools,
    after: Number //może wystąpić po jakim czasie
    repeat?: Number //może wystąpić co ile czasu
    maxUsages?: Number // ile razy można urzyć tej opcji (opcjonalne)
}

export interface Point{ //Point on the map
    x:Number,
    y:Number,
}




export interface Game{
    gameMode: GameModes, //tryb definiuje dodatkowe informacje
    gamePrivateJoin: boolean, //czy jest prywatna
    settings:[GameSetting], //dodatkowe opcje
    gameRealPoint: Point, //punkt ukrycia
    gameRenderPoint: Point, //może być generowane na cliencie ale lepiej podczas podtwierdzania 
    gameStart: Date, //kiedy gra ma się rozpącząc 
    gameDuration: Number, //jak długo ma trwać gra // można tu wstawić date dla wygody //można nazwać gameEnd
    gameEndOnFirstFound: boolean, //czy kończymy gre jeżeli cel został znaleziony
}