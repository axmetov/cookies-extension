<template>
  <template v-if="isStandardField(cookieField)">
    <input class="input-cell"
           v-if="!this.isTextarea(cookieField) && this.isInput(cookieField)"
           type="text"
           :value="cookieField.value"
           :data-key="cookieField.key"
           tabindex="0"
           @mouseup="(e) => this.onMouseUp(e, cellIdx)"
           @blur="this.onBlur"
           @keydown="onKey"
    />
    <textarea class="input-cell"
              v-if="this.isTextarea(cookieField)"
              :value="this.formatValueForTextarea(cookieField.value)"
              :data-key="cookieField.key"
              tabindex="0"
              rows="10"
              @mouseup="(e) => this.onMouseUp(e, cellIdx)"
              @blur="this.onBlur"
              @keydown="onKey"
    />
    <input class="input-cell"
           v-if="this.isCheckbox(cookieField)"
           type="checkbox"
           :checked="cookieField.value"
           :data-key="cookieField.key"
           tabindex="0"
           @mouseup="(e) => this.onMouseUp(e, cellIdx)"
           @blur="this.onBlur"
           @keydown="onKey"
    />
    <select class="input-cell"
            v-if="this.isSelect(cookieField)"
            :data-key="cookieField.key"
            tabindex="0"
            @mouseup="(e) => this.onMouseUp(e, cellIdx)"
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
          v-if="!isMutableText(cookieField)"
          tabindex="0"
          @mouseup="(e) => this.onMouseUp(e, cellIdx)"
          @blur="this.onBlur"
          @keydown="onKey"
    >
          {{ getOutputImmutableText(cookieField) }}
        </span>
  </template>
  <template v-else>
    <input class="input-cell"
           v-if="this.isExpirationDateMutableInput(cookieField)"
           type="text"
           :value="this.formatExpirationDate(cookieField.value)"
           :data-key="cookieField.key"
           tabindex="0"
           @mouseup="(e) => this.onMouseUp(e, cellIdx)"
           @blur="this.onBlur"
           @keydown="onKey"
    />
    <span class="immutable-cell"
          v-if="!this.isExpirationDateMutableInput(cookieField)"
          tabindex="0"
          @mouseup="(e) => this.onMouseUp(e, cellIdx)"
          @blur="this.onBlur"
          @keydown="onKey"
    >
          Session
        </span>
  </template>
</template>

<script>
import moment from "moment/moment";

export default {
  name: "DynamicCell",
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
  },
  methods: {
    isStandardField(cookieField) {
      return cookieField.key !== 'expirationDate' && cookieField.key !== 'session';
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
    isExpirationDateMutableInput(cookieField) {
      return cookieField.key === 'expirationDate' && !!cookieField.value;
    },

    formatExpirationDate(expirationDateTimestamp) {
      return moment(expirationDateTimestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
    },
    getOutputImmutableText(cookieField) {
      if (cookieField.key === 'secure') {
        return cookieField.value ? '✓' : '';
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
  input {
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

      &[type="text"] {
        height: 100%;
        padding: 3px 4px 3px 4px;

        &:hover {
          box-shadow: 0 0 0 1px #bbb;
        }

        &:focus {
          box-shadow: 0 0 0 1px #999;
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