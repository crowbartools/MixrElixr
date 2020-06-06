<template>
    <span>
        <span class="made-with-love-wrapper">
            Made with
            <i class="fa fa-heart pound"></i> by the
            <a @click="showModal">Mixer community</a>
        </span>
        <b-modal
            id="teamModal"
            ref="teamModal"
            size="sm"
            title="The Team"
            :hide-header="true"
            body-bg-variant="dark"
            body-text-variant="light"
            footer-bg-variant="dark"
            footer-text-variant="light"
            :ok-only="true"
            @ok="hideModal"
        >
            <h5 class="modal-title">Contributors</h5>
            <div v-for="contributor in contributors" :key="contributor.channelId">
                <a :href="'https:mixer.com/' + contributor.channelId" target="_blank">{{ contributor.name }}</a>
            </div>
            <h5 class="modal-title" style="padding-top: 20px">Need Help?</h5>
            <div style="font-size:16px">
                If you have questions, please reach out to us
                <a class="light-blue-link" href="https://twitter.com/MixrElixr" target="_blank">on Twitter</a> or post
                in the #elixr-help channel of
                <a class="light-blue-link" href="https://discord.gg/2CGrbA4" target="_blank">our Discord</a>.
            </div>
            <div class="disclaimer">
                MixrElixr is neither created nor endorsed by Mixer or Microsoft. It is created by the community for the
                community.
            </div>
            <div slot="modal-footer" style="text-align: center; width: 100%;">
                <b-btn variant="primary" @click="hideModal">Ok</b-btn>
            </div>
        </b-modal>
    </span>
</template>

<script>
export default {
    data() {
        return {
            contributors: [
                {
                    name: 'ebiggz',
                    channelId: 2989516
                },
                {
                    name: 'TheLastMage',
                    channelId: 40812
                },
                {
                    name: 'ThePerry',
                    channelId: 43565
                },
                {
                    name: 'Carlyndra',
                    channelId: 73626
                },
                {
                    name: 'murfGUY',
                    channelId: 217203
                },
                {
                    name: 'FierySama',
                    channelId: 194587
                },
                {
                    name: 'PhantomThiefZero',
                    channelId: 23548324
                },
                {
                    name: 'Unlocked',
                    channelId: 6068
                },
                {
                    name: 'Argus9Z',
                    channelId: 7755885
                }
            ]
        };
    },
    methods: {
        showModal: function() {
            this.$refs.teamModal.show();
        },
        hideModal: function() {
            this.$refs.teamModal.hide();
        }
    }
};
</script>

<style lang="scss">
#teamModal {
    text-align: center;
}
</style>
