<template>
  <div id="app">
    <label>
      <input type="checkbox" v-model="within" :value="true" />
      within
    </label>
    <label>
      <input type="checkbox" v-model="draggable" :value="true" />
      draggable
    </label>
    <label>
      <input type="checkbox" v-model="zoom" :value="true" />
      zoom
    </label>
    <br />
    <button @click="onGotoCell()">Goto cell</button>
    <input v-model="centerX" type="number" style="width: 50px" />
    <input v-model="centerY" type="number" style="width: 50px" />
    <br/>
    <br/>
    <MapHexagon
      ref="map"
      :width="340"
      :item-size="100"
      :items-gap="5"
      :zoom="zoom"
      :draggable="draggable"
      :within="within"
      :center="center"
      :cells="cells"
      style="border: 1px solid black"
      @dragging="(e) => onEvent('dragging', e)"
      @scaling="(e) => onEvent('scaling', e)"
      @click="onClick"
    >
    </MapHexagon>
    <p style="width: 340px">
      {{ eventName }}:<br />
      {{ eventData }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MapHexagon, { HexagonCell } from "@coddicat/vue-map-hexagon"; // "../../lib/index";

function generateCells(left: number, right: number): HexagonCell[] {
  const cells = Array<HexagonCell>();
  let index = 0;
  for (let col = left; col <= right; col++)
    for (let row = left; row <= right; row++) {
      const imgIndex = Math.floor(Math.random() * 100);
      const imgTobe = Math.random() > 0.8;
      const rndColor =
        Math.random() > 0.7 ? "#af9" : Math.random() > 0.3 ? "#69e" : "#9a6";

      cells.push({
        row: row,
        col: col,
        index: index,
        hexagonClass: "hexagon-custom",
        borderSize: 1,
        borderColor: undefined,
        backgroundColor: rndColor,
        backgroundImage: imgTobe
          ? `url(https://picsum.photos/id/${imgIndex}/100/100`
          : undefined,
        text: `#${index} <br/> (${col}, ${row})`,
        textStyle: { "text-align": "center" },
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
    private eventName = '';
    private eventData = '';
    private within = true;
    private draggable = true;
    private zoom = true;
    private center = [0, 0];
    private centerX = 47;
    private centerY = -45;
    private cells: HexagonCell[] = generateCells(-50, 50);

    public onClick(cell: HexagonCell): void {
      alert(`Clicked #${cell.index}`);
    }
    public onEvent(eventName: string, eventData: any): void {
      this.eventName = eventName;
      this.eventData = eventData;
    }
    public onGotoCell(): void {
      this.center = [this.centerX, this.centerY];
      const map = this.$refs.map as any;
      map.submitCenter();
    }
}
</script>
