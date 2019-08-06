<template>
  <div v-cloak @scroll="addMoreFriendsCheck">
    <div class="sentinel"></div>
    <div class="sticky">
      <nav-bar @tab-changed="updateActiveTab"></nav-bar>
    </div>
    <div class="page-wrapper">					
      <div class="tabs-wrapper">
        <div v-show="activeTab == 'online'" id="onlineFriends" class="tab-content">
          <online-friends-list></online-friends-list>
        </div>
        <div v-show="activeTab == 'options'" class="tab-content" style="padding: 20px 0;">
          <streamer-page-options></streamer-page-options>			
          <home-page-options></home-page-options>
          <general-options></general-options>
          <div style="text-align: center">
            <made-with-love></made-with-love>
          </div>
        </div>	
      </div>			
    </div>	
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
};
</script>