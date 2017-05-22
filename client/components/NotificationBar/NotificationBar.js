import React, { Component } from 'react';
import autobind from 'autobind-decorator';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from 'material-ui/svg-icons/social/notifications';
import Badge from 'material-ui/Badge';
import { browserHistory } from 'react-router';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';

import styles from './notification-bar.css';

class NotificationBar extends Component {

  @autobind
  static handleEventLinkClick(id) {
    browserHistory.push(`/event/${id}`);
  }

  constructor(props) {
    super(props);
    this.state = {
      events: this.props.events,
      curUser: this.props.curUser,
      notificationColor: '#ff0000',
      quantOwnerNotNotified: 0,
    };
  }

  componentWillMount() {
    const { events, curUser } = this.props;
    this.setState({ events, curUser }, this.IconButtonColor());
  }

  componentWillReceiveProps(nextProps) {
    const { events } = nextProps;
    this.setState({ events }, this.IconButtonColor());
  }

  @autobind
  async handleDismissAll() {
    const { events } = this.state;
    const { cbHandleDismissGuest } = this.props;
    const guestDismissList = [];
    events.forEach((event) => {
      event.participants.forEach((participant) => {
        if (participant.ownerNotified === false) {
          guestDismissList.push(participant._id);
        }
      });
    });
    try {
      await cbHandleDismissGuest(guestDismissList);
    } catch (err) {
      console.log('error at handleDismissAll NoficationBar', err);
    } finally {
      this.IconButtonColor();
    }
  }

  IconButtonColor() {
    const { events, curUser } = this.state;
    let notificationColor;
    let quantOwnerNotNotified = 0;
    if (events.length > 0) {
      events.forEach((event) => {
        event.participants.forEach((participant) => {
          if (
            participant.userId._id.toString() !== curUser._id
            && participant.ownerNotified === false
            && event.owner.toString() === curUser._id
          ) {
            quantOwnerNotNotified += 1;
          }
        });
      });
    }
    this.setState({ notificationColor, quantOwnerNotNotified });
  }

  @autobind
  handleOnRequestChange(open, reason) {
    console.log(open, reason);
  }

  renderMenuRows() {
    const { events, curUser } = this.state;
    const { handleEventLinkClick } = this.constructor;
    const rows = [];

    if (events) {
      events.forEach((event) => {
        if (event.owner.toString() === curUser._id) {
          event.participants.forEach((participant) => {
            if (participant.userId._id !== curUser._id) {
              let bkgColor = '#ffffff';
              if (!participant.ownerNotified) {
                bkgColor = '#EEEEFF';
              }
              const row = (
                <MenuItem
                  key={`${participant._id} first`}
                  value={participant._id}
                  style={{ backgroundColor: bkgColor }}
                  styleName="menuItem"
                >
                  {participant.userId.name} <span>accepted your invitation for &#32;</span>
                  <a
                    onTouchTap={() => handleEventLinkClick(event._id)}
                    styleName="eventLink"
                  >{event.name}</a>.
              </MenuItem>
              );
              rows.push(row);
            }
          });
        }
      });
    }
    return rows;
  }

  render() {
    const { quantOwnerNotNotified } = this.state;
    const visible = (quantOwnerNotNotified === 0) ? 'hidden' : 'visible';
    const inLineStyles = {
      badge: {
        right: 47,
        top: 30,
        visibility: visible,
        fontSize: '12px',
        width: 16,
        height: 16,
      },
      iconButton: {
        icon: {
          color: 'white',
          width: '19px',
        },
      },
    };
    return (
      <IconMenu
        maxHeight={300}
        iconStyle={inLineStyles.iconButton}
        onRequestChange={(open, reason) => this.handleOnRequestChange(open, reason)}
        styleName="iconMenu"
        iconButtonElement={
          <Badge
            badgeContent={quantOwnerNotNotified}
            secondary
            badgeStyle={inLineStyles.badge}
          >
            <IconButton
              tooltip="Notifications"
              onTouchTap={this.handleDismissAll}
              iconStyle={inLineStyles.iconButton.icon}
            >
              <NotificationsIcon size={10} />
            </IconButton>
          </Badge>
        }
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {this.renderMenuRows()}
      </IconMenu >
    );
  }
}

NotificationBar.propTypes = {
  // Currrent user
  curUser: PropTypes.shape({
    _id: PropTypes.string,      // Unique user id
    name: PropTypes.string,     // User name
    avatar: PropTypes.string,   // URL to image representing user(?)
  }).isRequired,

  cbHandleDismissGuest: PropTypes.func.isRequired,

  // List of events containing list of event participants
  events: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      owner: PropTypes.string,
      active: PropTypes.bool,
      selectedTimeRange: PropTypes.array,
      dates: PropTypes.arrayOf(PropTypes.shape({
        fromDate: PropTypes.string,
        toDate: PropTypes.string,
        _id: PropTypes.string,
      })),
      participants: PropTypes.arrayOf(PropTypes.shape({
        userId: PropTypes.shape({
          id: PropTypes.string,
          avatar: PropTypes.string,
          name: PropTypes.string,
          emails: PropTypes.arrayOf(PropTypes.string),
        }),
        _id: PropTypes.string,
        status: PropTypes.oneOf([0, 1, 2, 3]),
        emailUpdate: PropTypes.bool,
        ownerNotified: PropTypes.bool,
        availability: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
      })),
    }),
  ).isRequired,
};

export default cssModules(NotificationBar, styles);
