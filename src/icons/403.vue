<template>
  <div class="image-container">
    <img :src="imageSrc" :alt="altText" />
    <div class="caption" v-text="captionText"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageSrc: '../../qrcode.jpg',
      altText: 'Image description',
      captionText: '进群获取认证码'
    }
  }
}
</script>

<style>
.image-container {
  position: relative;
}

.caption {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 10px;
  font-size: 14px;
}
</style>
