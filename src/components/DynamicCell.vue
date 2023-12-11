<template>
  <template v-if="isRenderableField(cookieField)">
    <input class="input-cell"
      v-if="!this.isTextarea(cookieField) && this.isInput(cookieField)"
      type="text"
      :value="cookieField.value"
      :title="cookieField.value"
      :data-key="cookieField.key"
      :id="this.getCellId(cookieField.key)"
      tabindex="0"
      @mouseup="(e) => this.onMouseUp(e, cellIdx, cookieField.key)"
      @blur="this.onBlur"
      @keydown="onKey"
    />
    <textarea class="input-cell"
      v-else-if="this.isTextarea(cookieField)"
      :value="this.formatValueForTextarea(cookieField.value)"
      :title="this.formatValueForTextarea(cookieField.value)"
      :data-key="cookieField.key"
      :id="this.getCellId(cookieField.key)"
      tabindex="0"
      rows="10"
      @mouseup="(e) => this.onMouseUp(e, cellIdx, cookieField.key)"
      @blur="this.onBlur"
      @keydown="onKey"
    />
    <input class="input-cell"
      v-else-if="this.isCheckbox(cookieField)"
      type="checkbox"
      :checked="cookieField.value"
      :data-key="cookieField.key"
      :id="this.getCellId(cookieField.key)"
      tabindex="0"
      @mouseup="(e) => this.onMouseUp(e, cellIdx, cookieField.key)"
      @blur="this.onBlur"
      @keydown="onKey"
    />
    <expiration-date-cell
      v-if="this.isExpirationDateInput(cookieField)"
      :expirationDateTimestamp="cookieField.value"
      :cookieKey="cookieField.key"
      :id="this.getCellId(cookieField.key)"
      tabindex="0"
      :onMouseUp="(e) => onMouseUp(e, cellIdx, cookieField.key)"
      :onBlur="onBlur"
      :onKey="onKey"
    />
    <select class="input-cell"
      v-else-if="this.isSelect(cookieField)"
      :data-key="cookieField.key"
      :id="this.getCellId(cookieField.key)"
      tabindex="0"
      @mouseup="(e) => this.onMouseUp(e, cellIdx, cookieField.key)"
      @blur="this.onBlur"
      @change="this.onSelectChange"
    >
      <option v-for="(text, value) in cookieField.enumValues"
        :value="value"
        :selected="cookieField.value === value"
      >
        {{ text }}
      </option>
    </select>
    <span class="immutable-cell"
      v-else-if="!isMutableText(cookieField)"
      tabindex="0"
      @mouseup="(e) => this.onMouseUp(e, cellIdx, cookieField.key)"
      @blur="this.onBlur"
      @keydown="onKey"
      :title="getOutputImmutableText(cookieField)"
    >
      {{ getOutputImmutableText(cookieField) }}
    </span>
  </template>
</template>

<script>
import ExpirationDateCell from "./ExpirationDateCell";

export default {
  name: "DynamicCell",
  components: {ExpirationDateCell},
  props: {
    cookieField: Object,
    cellIdx: {
      type: Number,
      required: false,
    },
    onMouseUp: Function, // above, focus is counted on mouseup to not reset a user action in process with cookie viewer
    onBlur: Function,
    onSelectChange: Function,
    onKey: Function,
    valueAsTextarea: {
      type: Boolean,
      default: false,
    },
    place: {
      type: String,
      required: true,
    },
  },
  methods: {
    getCellId(cookieFieldKey) {
      return this.place === 'editor' ? `e-${cookieFieldKey}` : `r-${cookieFieldKey}`;
    },
    isRenderableField(cookieField) {
      return cookieField.key !== 'session';
    },
    isInput(cookieField) {
      return this.isMutableText(cookieField) && cookieField.type === 'string';
    },
    isTextarea(cookieField) {
      return this.isInput(cookieField) && cookieField.key === 'value' && this.valueAsTextarea;
    },
    isCheckbox(cookieField) {
      return this.isMutableText(cookieField) && cookieField.type === 'bool';
    },
    isSelect(cookieField) {
      return this.isMutableText(cookieField) && cookieField.type === 'enum';
    },
    isMutableText(cookieField) {
      return cookieField.mutable;
    },
    isExpirationDateInput(cookieField) {
      return cookieField.key === 'expirationDate';
    },
    getOutputImmutableText(cookieField) {
      if (cookieField.key === 'secure') {
        return cookieField.value ? '✓' : '×';
      }

      return cookieField.value;
    },
    formatValueForTextarea(rawValue) {
      const decodedUriValue = decodeURIComponent(rawValue);

      try {
        const decodedJson = JSON.parse(decodedUriValue);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (decodedJson && typeof decodedJson === 'object') {
          return JSON.stringify(decodedJson, null, 2);
        }
      }
      catch (e) { }

      return decodedUriValue;
    },
  },
}
</script>

<style lang="less" scoped>
  input, textarea {
    font-size: 13px;
    background-color: unset;

    &.input-cell {
      max-width: 100%;
      width: 100%;
      box-sizing: border-box;
      border: none;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      transition: box-shadow 80ms ease-in-out;

      &:not([type="checkbox"]) {
        height: 100%;
        padding: 3px 4px 3px 4px;

        &:hover {
          outline: 1px solid #777;
        }

        &:focus {
          box-shadow: 0 0 1px 2px #59a0ee;
          outline: none;
          background-color: white;
        }
      }

      &[type="checkbox"] {
        width: 50%;
        margin: 0 auto;

        &:focus {
          outline: 1px dotted black;
        }
      }
    }
  }

  select.input-cell {
    margin-left: 4px;
    height: 100%;

    &:focus {
      outline: 1px dotted black;
    }
  }

  span.immutable-cell {
    max-width: 100%;
    width: 100%;
    display: inline-block;
    box-sizing: border-box;
    padding: 3px 4px 3px 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    &:focus {
      outline: 1px dotted black;
    }
  }
</style>