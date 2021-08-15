export interface HexagonCell {
    index: number,
    row: number,
    col: number,
    hexagonClass: string | undefined,
    borderSize: number | undefined,
    borderColor: string | undefined,
    backgroundColor: string | undefined,
    backgroundImage: string | undefined,
    text: string | undefined,
    textStyle: object | undefined,
}

export interface HexagonCellData {
    index: number,
    row: number,
    col: number,
}
