use anchor_lang::prelude::*;

pub mod actions;
pub use actions::*;

pub use anchor_lang::solana_program::clock;
pub use anchor_spl::token::{Token, TokenAccount};
pub use switchboard_v2::{
    OracleQueueAccountData, PermissionAccountData, SbState, VrfAccountData, VrfRequestRandomness,
};

declare_id!("DQiap4465pYr8MqFS3VzSG8NkVLNJeVP6rQNQ1eSwwD4");

#[program]
pub mod vrf_client {
    use super::*;

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn init_client(ctx: Context<InitClient>, params: InitClientParams) -> Result<()> {
        InitClient::actuate(&ctx, &params)
    }
}