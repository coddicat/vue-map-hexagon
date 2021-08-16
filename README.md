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
- <A href="https://github.com/coddicat/vue-hexagon">@coddicat/vue-hexagon</a>

## Usage without slot with cells prop
template:
```
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

script:
```
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
      
  export default Vue.extend({
    components: {
      MapHexagon,
    },
    data: () => ({
      cells: generateCells(),
    methods: {
      onClick(cell: HexagonCell) {
        alert(`Clicked #${cell.index}`);
      }
    },
  });
```

## Usage with a slot and with component @coddicat/vue-hexagon (can be replaced with whatever you want)
template:
```
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

script:
```
  import MapHexagon from "@coddicat/vue-map-hexagon";
  import Hexagon from "@coddicat/vue-hexagon";
  
  export default {
    components: {
      HexagonMap,
      Hexagon,
    },
    data: () => ({
      scale: 1,
      center: [3, 3]
    }),
    methods: {
      reset() {
        this.scale = 1;
        this.center = [3, 3];
        this.$refs.map.submitScale();
        this.$refs.map.submitCenter();
      },
    },
  };  
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
```
.submitCenter(); //when changed center prop or goto centered cell
.submitSize(); //when changed width and height props
.submitScale(); //when changed scale prop or restore scale with the value

```
