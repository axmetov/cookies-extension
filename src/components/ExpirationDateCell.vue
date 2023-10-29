<template>
  <input class="input-cell"
         type="text"
         :value="formattedExpirationDate"
         :title="formattedExpirationDate"
         :data-key="cookieKey"
         data-fallback-value=""
         tabindex="0"
         @mouseup="onMouseUp"
         @blur="onBlurInternal"
         @keydown="onKey"
         ref="cell"
         placeholder="Date with optional time OR `Session`"
  />
</template>

<script>
import moment from "moment/moment";

export default {
  name: "ExpirationDateCell",
  props: {
    expirationDateTimestamp: {
      type: Number,
      required: false,
      nullable: true,
    },
    cookieKey: {
      type: String,
      required: true,
    },
    onMouseUp: {
      type: Function,
      required: true,
    },
    onBlur: {
      type: Function,
      required: true,
    },
    onKey: {
      type: Function,
      required: true,
    },
  },
  mounted() {
    this.$refs.cell.dataset.fallbackValue = this.formattedExpirationDate;
  },
  computed: {
    formattedExpirationDate() {
      // when cookie is session-only, it doesn't have expiration dt
      if (this.isSession) {
        return 'Session';
      }

      return this.formatExpirationDate(this.expirationDateTimestamp);
    },
    isSession() {
      return this.expirationDateTimestamp === undefined;
    },
  },
  methods: {
    formatExpirationDate(expirationDateTimestamp) {
      return moment(expirationDateTimestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
    },
    onBlurInternal(e) {
      // adjust event hack
      let { value } = e.target;
      const momentDatetime = moment(value, 'YYYY-MM-DD HH:mm:ss', true);
      const momentDate = moment(value, 'YYYY-MM-DD', true);
      const isSession = value.toLowerCase() === 'session';

      if (!isSession && !momentDatetime.isValid() && !momentDate.isValid()) {
        // was not able to set the value, fallback
        e.target.value = this.$refs.cell.dataset.fallbackValue;
        return;
      }

      // option to augment date with time
      if (momentDate.isValid()) {
        value = momentDate.format('YYYY-MM-DD HH:mm:ss');
      }

      e.target.value = isSession ? 'Session' : value;
      this.$refs.cell.dataset.fallbackValue = e.target.value; // value is set, update fallback

      this.onBlur(e);
    },
  },
}
</script>

<style scoped>
</style>