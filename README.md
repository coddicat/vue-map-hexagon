# vue-map-hexagon
Vue component for displaying a map/grid of hexagons. The component supports scrolling and scaling.

#### example:
https://vue-map-hexagon.coddicat.com/

<img src="https://github.com/coddicat/vue-map-hexagon/blob/master/example/map-hexagon.gif" width="250"/>

## Installation
```
npm i @coddicat/vue-map-hexagon
```

## Dependencies
The component uses following external components:
- <a href="https://github.com/coddicat/vue-pinch-scroll-zoom">@coddicat/vue-pinch-scroll-zoom</a>
- <a href="https://github.com/coddicat/vue-hexagon">@coddicat/vue-hexagon</a>

## Usage without slot with cells prop
template:
```html
  <MapHexagon
    :item-size="100"
    :items-gap="5"
    :center="[0, 0]"
    :cells="cells"
    style="border: 1px solid black"
    @click="onClick"
  >
  </MapHexagon>
```

type script:
```ts
  import { Component, Vue } from "vue-property-decorator";
  import MapHexagon, { HexagonCell } from "@coddicat/vue-map-hexagon";
  
  //get array of cells
  function generateCells(): HexagonCell[] {
    const cells = Array<HexagonCell>();
    let index = 0;
    for (let col = -5; col <= 5; col++)
      for (let row = -5; row <= 5; row++) {
        cells.push({
          row: row,
          col: col,
          index: index,
          borderSize: 1,
          text: `#${index} <br/> (${col}, ${row})`,
          textStyle: { "text-align": "center" },
          hexagonClass: undefined,
          borderColor: undefined,
          backgroundColor: undefined,
          backgroundImage: undefined,
        });
        index++;
      }
    return cells;
  }

  @Component({
    name: "MapHexagonExample",
    components: {
      MapHexagon
    },
  })
  export default class MapHexagonExample extends Vue {
    private cells: HexagonCell[] = generateCells();
    public onClick(cell: HexagonCell): void {
      alert(`Clicked #${cell.index}`);
    }
  }
```

## Usage with a slot and with component <a href="https://github.com/coddicat/vue-hexagon">@coddicat/vue-hexagon</a> 
(can be replaced with whatever you want)
template:
```html
  <HexagonMap
      :scale="scale"
      :center="center"
      :x-range="[-5, 10]"
      :y-range="[-10, 15]"
      :item-size="120"
      :items-gap="10"
      style="border: 1px solid black"
  >
      <template slot-scope="{ index, itemSize, col, row }">
        <Hexagon :size="itemSize" :border-size="1">
          <span>
            {{ index }} <br/> 
            ({{ col }}, {{ row }})
          </span>
        </Hexagon>
      </template>
  </HexagonMap>
```

type script:
```ts
  import { Component, Vue } from "vue-property-decorator";
  import MapHexagon from "@coddicat/vue-map-hexagon";
  import Hexagon from "@coddicat/vue-hexagon";
  
  @Component({
    name: "MapHexagonExample",
    components: {
      MapHexagon,
      Hexagon
    },
  })
  export default class MapHexagonExample extends Vue {
    private scale: number = 1;
    private center: number[] = [3, 3];
    
    public reset(): void {
      this.scale = 1;
      this.center = [3, 3];
      const map = this.$refs.map as MapHexagon;
      map.submitScale();
      map.submitCenter();
    }
  }
```

## Props
the following properties don't support the ".async" modifier

|name|required|description|default|
|----|--------|-----------|-------|
|cells|no|array of cells to render without slot||
|width|no|visible area width|400|
|height|no|visible area height|400|
|xRange|no|[start, end] array of two items to set range of the x axis|[-5,5] or [min, max] col property, if the cells prop exists|
|yRange|no|[start, end] array of two items to set range of the y axis|[-5,5] or [min, max] row property, if the cells prop exists|
|itemSize|no|hexagon size|100|
|itemsGap|no|size of gaps between cells of hexagons|100|
|within|no|limit scrolling of content to its borders|false|
|zoom|no|scaling of/off|true|
|minScale|no|minimum allowable scaling|0.6|
|maxScale|no|maximum allowable scaling|3|
|center|no|[col, row] array of two items to set the centered cell to be displayed in the center of the visible area|automatically calculated on xRange and yRange props|
|scale|no|scale of the content|1|
|autoCenter|no|display centered cell to be displayed in the center of the visible area|yes|
|draggable|no|draggable of/off|true|
|scrollZoomThrottleDelay|no|zooming/dragging rendering delay (milliseconds)|40|
|renderThrottleDelay|no|hexagon hide/show rendering delay (milliseconds)|200|

## Events
- dragging
- scaling
- click //click on hexagon when used cells prop

## Methods
```ts
.submitCenter(); //when changed center prop or goto centered cell
.submitSize(); //when changed width and height props
.submitScale(); //when changed scale prop or restore scale with the value

```
